module.exports = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "No user" });
  if (req.user.rol !== "admin")
    return res.status(403).json({ error: "Solo admin" });
  next();
};
