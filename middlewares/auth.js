// middlewares/auth.js → VERSIÓN FINAL QUE NUNCA MÁS TE VA A ECHAR
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET || 'changeme', (err, decoded) => {
    if (err) {
      console.log('Token inválido o expirado:', err.message);
      return res.status(401).json({ error: 'Token inválido' });
    }

    // ESTA LÍNEA ES LA QUE SALVA TODO
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Token corrupto' });
    }

    req.user = decoded;  // ← ahora siempre tiene .id
    next();
  });
};
