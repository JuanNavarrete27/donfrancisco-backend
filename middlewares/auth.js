// middlewares/auth.js
// ============================================================
// DON FRANCISCO — Auth middleware estable
// ✅ Compatibilidad TOTAL:
//    - const auth = require("./auth")          -> auth(req,res,next)
//    - const { authRequired } = require("./auth") -> authRequired(...)
// ============================================================

const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  try {
    const h = req.headers["authorization"] || req.headers["Authorization"];

    if (!h) {
      return res.status(401).json({ ok: false, error: "NO_TOKEN" });
    }

    const parts = String(h).split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ ok: false, error: "TOKEN_MALFORMED" });
    }

    const token = parts[1]?.trim();
    if (!token) {
      return res.status(401).json({ ok: false, error: "NO_TOKEN" });
    }

    const secret = process.env.JWT_SECRET || "changeme"; // si querés producción estricta, lo ajustamos
    const decoded = jwt.verify(token, secret);

    req.user = decoded?.user || decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "INVALID_OR_EXPIRED_TOKEN" });
  }
}

/* ============================================================
   ✅ EXPORT COMPATIBLE CON TODO TU BACKEND
   - module.exports = función (para require directo)
   - module.exports.authRequired = función (para destructuring)
============================================================ */
module.exports = authRequired;
module.exports.authRequired = authRequired;
