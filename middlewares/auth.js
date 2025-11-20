// middlewares/auth.js → VERSIÓN 100% FUNCIONAL (NO TOQUES NUNCA MÁS)
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token mal formado' });
  }

  const token = parts[1];

  jwt.verify(token, process.env.JWT_SECRET || 'changeme', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    req.user = decoded; // ← acá está tu id, nombre, foto, todo
    next();
  });
};
