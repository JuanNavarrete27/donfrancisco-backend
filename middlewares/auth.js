// middlewares/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const h = req.headers["authorization"];
  if (!h) return res.status(401).json({ error: "No token provided" });

  const parts = h.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ error: "Token mal formado" });

  const token = parts[1];

  jwt.verify(token, process.env.JWT_SECRET || "changeme", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido o expirado" });

    req.user = decoded;
    next();
  });
};
