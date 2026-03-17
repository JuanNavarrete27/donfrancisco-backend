// middlewares/role.js
// ============================================================
// DON FRANCISCO — Role Guard
// requireRole('admin','staff',...)
// - Lee role desde req.user.role (si tu auth lo setea)
// - Tolera rol con distintos nombres: rol/perfil/type
// ============================================================

function normalizeRoleName(raw) {
  const r = String(raw || "").toLowerCase().trim();

  // ---------------------------
  // Admin aliases
  // ---------------------------
  if (r === "administrador" || r === "administrator") return "admin";
  if (r === "superadmin") return "admin";
  if (r === "owner") return "admin";
  if (r === "root") return "admin";
  if (r.includes("admin")) return "admin";

  // ---------------------------
  // Funcionario aliases
  // ---------------------------
  if (r === "funcionario") return "funcionario";
  if (r === "employee") return "funcionario";
  if (r === "empleado") return "funcionario";
  if (r === "worker") return "funcionario";

  // ---------------------------
  // Local role aliases
  // ---------------------------
  if (r === "local") return "local";
  if (r === "locale") return "local";
  if (r === "local_admin") return "local";
  if (r === "business_owner") return "local";
  if (r === "negocio") return "local";

  // ---------------------------
  // Marketing aliases
  // ---------------------------
  if (r === "marketing") return "marketing";
  if (r === "marketin") return "marketing";

  // ---------------------------
  // Defaults
  // ---------------------------
  return r || "staff";
}

function extractRole(req) {
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

module.exports = { requireRole, extractRole, normalizeRoleName };
