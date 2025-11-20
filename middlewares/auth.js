// middlewares/auth.js → VERSIÓN QUE FUNCIONA 100%
const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');

    // CARGA TODOS LOS DATOS DEL USUARIO (incluyendo nombre y foto)
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, email, rol, foto FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = rows[0]; // ← AHORA SÍ tiene nombre, apellido, foto
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
