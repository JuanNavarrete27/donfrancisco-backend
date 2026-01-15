// middlewares/role.js
// ============================================================
// DON FRANCISCO — Role Guard
// requireRole('admin','staff',...)
// - Lee role desde req.user.role (si tu auth lo setea)
// - Tolera rol con distintos nombres: rol/perfil/type
// ============================================================

function normalizeRoleName(raw) {
  const r = String(raw || "").toLowerCase().trim();

  if (r === "administrador" || r === "administrator") return "admin";
  if (r === "superadmin") return "admin";
  if (r === "owner") return "admin";
  if (r === "root") return "admin";

  if (r.includes("admin")) return "admin";

  return r || "staff";
}

function extractRole(req) {
  // ✅ lo normal: req.user.role
  const u = req.user || {};

  const role =
    u.role ||
    u.rol ||
    u.perfil ||
    u.userType ||
    u.tipo ||
    u?.data?.role ||
    u?.profile?.role;

  return normalizeRoleName(role);
}

function requireRole(...allowedRoles) {
  const allowed = (allowedRoles || []).map(normalizeRoleName);

  return (req, res, next) => {
    try {
      // ⚠️ si tu authRequired no setea req.user,
      // esto te va a quedar como staff y bloqueará rutas admin
      const currentRole = extractRole(req);

      if (!allowed.length) return next();

      if (!allowed.includes(currentRole)) {
        return res.status(403).json({
          ok: false,
          error: "ROLE_FORBIDDEN",
          role: currentRole,
          allowed,
        });
      }

      return next();
    } catch (e) {
      console.error("requireRole error:", e);
      return res.status(500).json({ ok: false, error: "ROLE_MIDDLEWARE_ERROR" });
    }
  };
}

module.exports = { requireRole };
