const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Normalizar foto para frontend
function normalizarFoto(foto) {
  if (!foto) return null;
  const invalido = ["0", "default", "undefined", "null", ""];
  if (invalido.includes(foto.trim())) return null;
  return foto;
}

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body;
@@ -17,8 +25,10 @@ exports.register = async (req, res) => {
    }

    const hash = bcrypt.hashSync(password, 10);

    // FOTO DEFAULT = NULL
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?)',
      'INSERT INTO usuarios (nombre, apellido, email, password, rol, foto) VALUES (?, ?, ?, ?, ?, NULL)',
      [nombre || '', apellido || '', email, hash, rol || 'user']
    );

@@ -50,26 +60,29 @@ exports.login = async (req, res) => {
    }

    const token = jwt.sign(
  { 
    id: user.id, 
    email: user.email, 
    rol: user.rol,
    nombre: user.nombre || '',
    apellido: user.apellido || ''
  },
  process.env.JWT_SECRET || 'changeme',
  { expiresIn: '8h' }
);
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol,
        nombre: user.nombre || '',
        apellido: user.apellido || ''
      },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol
        rol: user.rol,
        foto: normalizarFoto(user.foto)
      }
    });

  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
@@ -79,8 +92,14 @@ exports.login = async (req, res) => {
// ==================== LISTAR USUARIOS (solo admin) ====================
exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol FROM usuarios');
    res.json(rows);
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol, foto FROM usuarios');
    
    const usuarios = rows.map(u => ({
      ...u,
      foto: normalizarFoto(u.foto)
    }));

    res.json(usuarios);
  } catch (err) {
    console.error('Error en listUsers:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
@@ -91,13 +110,18 @@ exports.listUsers = async (req, res) => {
exports.getUser = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = ?',
      'SELECT id, nombre, apellido, email, rol, foto FROM usuarios WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);

    const user = rows[0];
    user.foto = normalizarFoto(user.foto);

    res.json(user);
  } catch (err) {
    console.error('Error en getUser:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
@@ -106,7 +130,7 @@ exports.getUser = async (req, res) => {

// ==================== ACTUALIZAR USUARIO ====================
exports.updateUser = async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body;
  const { nombre, apellido, email, password, rol, foto } = req.body;
  const campos = [];
  const valores = [];

@@ -115,6 +139,12 @@ exports.updateUser = async (req, res) => {
  if (email !== undefined) { campos.push('email = ?'); valores.push(email); }
  if (rol !== undefined) { campos.push('rol = ?'); valores.push(rol); }

  // Foto: si mandan algo inválido → guardo NULL
  if (foto !== undefined) {
    campos.push('foto = ?');
    valores.push(normalizarFoto(foto));
  }

  try {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
@@ -127,6 +157,7 @@ exports.updateUser = async (req, res) => {
    }

    valores.push(req.params.id);

    await db.query(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
      valores
