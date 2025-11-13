
/*
  middlewares/soloAdmin.js - allow only when req.user.rol === 'admin'
*/
module.exports = function(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No user info' });
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  next();
};
