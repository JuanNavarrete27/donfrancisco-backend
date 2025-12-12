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

/* ============================================================
   REGISTER
   👉 Siempre crea usuarios con rol = 'user'
============================================================ */
exports.register = async (req, res) => {
  const { nombre, apellido, email, password, telefono } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const [exists] = await db.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    if (exists.length > 0) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    const hash = bcrypt.hashSync(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, rol, telefono)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre || "",
        apellido || "",
        email,
        hash,
        "user",          // 🔒 rol fijo
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
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
        rol: user.rol,                 // 👈 clave para permisos
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

    res.json({
      id: u.id,
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      email: u.email,
      telefono: u.telefono || "",
      rol: u.rol,
      foto: normalizarFoto(u.foto)
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
