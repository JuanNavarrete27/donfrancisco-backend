const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ============================================================
   Helpers
============================================================ */
function normalizarFoto(f) {
  if (!f) return null;
  const invalid = ["0", "default", "undefined", "null", ""];
  return invalid.includes(String(f).trim()) ? null : f;
}

function normalizarUsuario(raw) {
  if (!raw) return "";
  return String(raw).trim().toLowerCase();
}

function usuarioValido(u) {
  return /^[a-z0-9._-]{3,20}$/.test(u);
}

// ✅ Normalización de rol (igual espíritu que middlewares/role.js)
function normalizeRoleName(raw) {
  const r = String(raw || "").toLowerCase().trim();

  if (r === "administrador" || r === "administrator") return "admin";
  if (r === "superadmin") return "admin";
  if (r === "owner") return "admin";
  if (r === "root") return "admin";
  if (r.includes("admin")) return "admin";

  if (r === "funcionario" || r === "employee" || r === "empleado" || r === "worker")
    return "funcionario";

  return r || "staff";
}

function buildAccessForRole(roleRaw) {
  const role = normalizeRoleName(roleRaw);

  const isAdmin = role === "admin";
  const isFuncionario = role === "funcionario";

  // ✅ estos son los “botones” que te pidió (paths front típicos)
  // Ajustalos si tus rutas front son distintas (no rompe nada igual)
  const linksFuncionario = [
    { label: "Reservas de Salón (Lectura)", path: "/admin/salon" },
    { label: "Mensajes de Contacto (Lectura)", path: "/admin/contacto" },
    { label: "FTP Empleo (Lectura + Export CSV)", path: "/admin/empleo" },
  ];

  const access = {
    role,

    // ✅ accesos funcionales
    canReadSalonAdmin: isAdmin || isFuncionario,
    canWriteSalonAdmin: isAdmin, // funcionario NO
    canReadContactoAdmin: isAdmin || isFuncionario,
    canWriteContactoAdmin: isAdmin, // funcionario NO (no marcar leído ni borrar)
    canReadFtpEmpleo: isAdmin || isFuncionario,
    canExportFtpEmpleoCsv: isAdmin || isFuncionario,
    canCrudFtpEmpleo: isAdmin, // funcionario NO

    // ✅ para que el front muestre botones (lo pidió explícito)
    quickLinks: isFuncionario ? linksFuncionario : [],
  };

  return access;
}

/* ============================================================
   REGISTER
============================================================ */
exports.register = async (req, res) => {
  const { nombre, apellido, password, telefono } = req.body;
  const usuario = normalizarUsuario(req.body.usuario || req.body.email);

  if (!usuario || !password) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  if (!usuarioValido(usuario)) {
    return res.status(400).json({
      error: "Usuario inválido (3-20, letras/números y . _ -)"
    });
  }

  try {
    const [exists] = await db.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [usuario]
    );

    if (exists.length > 0) {
      return res.status(409).json({ error: "Usuario ya registrado" });
    }

    const hash = bcrypt.hashSync(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, rol, telefono)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre || "",
        apellido || "",
        usuario,
        hash,
        "user",
        telefono || ""
      ]
    );

    res.status(201).json({
      mensaje: "Usuario creado",
      id: result.insertId
    });

  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error en registro" });
  }
};

/* ============================================================
   LOGIN
============================================================ */
exports.login = async (req, res) => {
  const { password } = req.body;
  const usuario = normalizarUsuario(req.body.usuario || req.body.email);

  if (!usuario || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  if (!usuarioValido(usuario)) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = rows[0];

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        foto: normalizarFoto(user.foto)
      },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        email: user.email,
        telefono: user.telefono || "",
        rol: user.rol,
        foto: normalizarFoto(user.foto)
      }
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error en login" });
  }
};

/* ============================================================
   GET ME (perfil del usuario logueado)
   ✅ AGREGADO access para botones/paths (funcionario)
============================================================ */
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, apellido, email, telefono, rol, foto
       FROM usuarios
       WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const u = rows[0];

    // ✅ NUEVO: access / quickLinks para rol funcionario
    const access = buildAccessForRole(u.rol);

    res.json({
      id: u.id,
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      email: u.email,
      telefono: u.telefono || "",
      rol: u.rol,
      foto: normalizarFoto(u.foto),

      // ✅ agregado sin romper nada
      access
    });

  } catch (err) {
    console.error("Error en getMe:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

/* ============================================================
   CAMBIAR PASSWORD
============================================================ */
exports.cambiarPassword = async (req, res) => {
  const { actual, nueva } = req.body;

  if (!actual || !nueva) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const [rows] = await db.query(
      "SELECT password FROM usuarios WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const passwordValido = bcrypt.compareSync(actual, rows[0].password);
    if (!passwordValido) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const hash = bcrypt.hashSync(nueva, 10);

    await db.query(
      "UPDATE usuarios SET password = ? WHERE id = ?",
      [hash, req.user.id]
    );

    res.json({ mensaje: "Contraseña actualizada" });

  } catch (err) {
    console.error("Error en cambiarPassword:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

/* ============================================================
   ACTUALIZAR AVATAR
============================================================ */
exports.actualizarFoto = async (req, res) => {
  let { foto } = req.body;

  if (!foto) {
    return res.status(400).json({ error: "Debe enviar un avatar" });
  }

  if (!foto.endsWith(".jpg")) {
    foto = foto + ".jpg";
  }

  const valid = ["avatar1.jpg", "avatar2.jpg", "avatar3.jpg", "avatar4.jpg"];
  if (!valid.includes(foto)) {
    return res.status(400).json({ error: "Avatar inválido" });
  }

  try {
    await db.query(
      "UPDATE usuarios SET foto = ? WHERE id = ?",
      [foto, req.user.id]
    );

    res.json({
      mensaje: "Avatar actualizado correctamente",
      foto
    });

  } catch (error) {
    console.error("Error en actualizarFoto:", error);
    res.status(500).json({ error: "Error al actualizar avatar" });
  }
};
