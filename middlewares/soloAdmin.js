// middlewares/soloAdmin.js
module.exports = (req, res, next) => {
  try {
    const rol = String(req.user?.rol || req.user?.role || '').toLowerCase().trim();

    // ✅ Admin o Marketing pueden editar noticias
    if (rol === 'admin' || rol === 'marketing') return next();

    return res.status(403).json({
      ok: false,
      error: "FORBIDDEN",
      message: "No tenés permisos para esta acción."
    });
  } catch (e) {
    return res.status(403).json({
      ok: false,
      error: "FORBIDDEN",
      message: "No tenés permisos."
    });
  }
};
