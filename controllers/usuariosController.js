const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function normalizarFoto(f) {
  if (!f) return null;
  const invalid = ["0", "default", "undefined", "null", ""];
  return invalid.includes(String(f).trim()) ? null : f;
}

// REGISTER
exports.register = async (req, res) => {
  const { nombre, apellido, email, password, rol, telefono } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Faltan datos obligatorios" });

  try {
    const [exists] = await db.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );
    if (exists.length > 0)
      return res.status(409).json({ error: "Email ya registrado" });

    const hash = bcrypt.hashSync(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, rol, telefono)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre || "", apellido || "", email, hash, rol || "user", telefono || ""]
    );

    res.status(201).json({ mensaje: "Usuario creado", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Error en registro" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Faltan datos" });

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const user = rows[0];

    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: "Credenciales inválidas" });

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
    res.status(500).json({ error: "Error en login" });
  }
};
