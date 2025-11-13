
/*
  controllers/usuariosController.js
*/
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  try {
    const [exists] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(409).json({ error: 'Email ya registrado' });
    const hash = bcrypt.hashSync(password, 10);
    const [result] = await db.query('INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?)', [nombre||'', apellido||'', email, hash, rol||'user']);
    res.status(201).json({ mensaje: 'Usuario creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, process.env.JWT_SECRET || 'changeme', { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol FROM usuarios');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

exports.updateUser = async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body;
  const campos = [];
  const vals = [];
  if (nombre) { campos.push('nombre = ?'); vals.push(nombre); }
  if (apellido) { campos.push('apellido = ?'); vals.push(apellido); }
  if (email) { campos.push('email = ?'); vals.push(email); }
  if (rol) { campos.push('rol = ?'); vals.push(rol); }
  try {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      campos.push('password = ?');
      vals.push(hash);
    }
    if (campos.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
    vals.push(req.params.id);
    await db.query('UPDATE usuarios SET ' + campos.join(', ') + ' WHERE id = ?', vals);
    res.json({ mensaje: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};


// Auto-generated stubs for missing exports
exports.register = (req,res) => res.status(501).json({'error':'register not implemented'});
exports.login = (req,res) => res.status(501).json({'error':'login not implemented'});
exports.listUsers = (req,res) => res.status(501).json({'error':'listUsers not implemented'});
exports.getUser = (req,res) => res.status(501).json({'error':'getUser not implemented'});
exports.updateUser = (req,res) => res.status(501).json({'error':'updateUser not implemented'});
exports.deleteUser = (req,res) => res.status(501).json({'error':'deleteUser not implemented'});
