
/*
  middlewares/auth.js - verify JWT in Authorization: Bearer <token>
*/
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Token mal formado' });
  const token = parts[1];
  jwt.verify(token, process.env.JWT_SECRET || 'changeme', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
};
