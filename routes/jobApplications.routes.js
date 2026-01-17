// routes/jobApplications.routes.js
// ============================================================
// DON FRANCISCO — FTP Empleo (Aplicaciones) Routes
// Base sugerida: /api/admin/empleo
//
// Roles:
//  - admin: CRUD + export
//  - funcionario: ver + export (SOLO LECTURA)
// ============================================================

const express = require("express");
const controller = require("../controllers/jobApplications.controller");

// ✅ middlewares
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/role");

const router = express.Router();

// ✅ VIEW (ver + export)
const ROLES_VIEW = [
  "admin",
  "staff",
  "user",
  "funcionario", // ✅ NUEVO
  "rrhh",
  "manager",
];

// ✅ ADMIN (CRUD)
const ROLES_ADMIN = ["admin"];

function ensureFn(fn, name) {
  if (typeof fn !== "function") {
    throw new Error(`Controller method missing: ${name} (is ${typeof fn})`);
  }
}

ensureFn(controller.list, "list");
ensureFn(controller.getById, "getById");
ensureFn(controller.exportCsv, "exportCsv");
ensureFn(controller.create, "create");
ensureFn(controller.update, "update");
ensureFn(controller.remove, "remove");

// ✅ LIST (VIEW)
router.get(
  "/applications",
  authRequired,
  requireRole(...ROLES_VIEW),
  controller.list
);

// ✅ EXPORT CSV (VIEW + EXPORT)
router.get(
  "/applications/export.csv",
  authRequired,
  requireRole(...ROLES_VIEW),
  controller.exportCsv
);

// ✅ GET ONE (VIEW)
router.get(
  "/applications/:id",
  authRequired,
  requireRole(...ROLES_VIEW),
  controller.getById
);

// ✅ CREATE (ADMIN ONLY)
router.post(
  "/applications",
  authRequired,
  requireRole(...ROLES_ADMIN),
  controller.create
);

// ✅ UPDATE (ADMIN ONLY)
router.put(
  "/applications/:id",
  authRequired,
  requireRole(...ROLES_ADMIN),
  controller.update
);

// ✅ DELETE (ADMIN ONLY)
router.delete(
  "/applications/:id",
  authRequired,
  requireRole(...ROLES_ADMIN),
  controller.remove
);

module.exports = router;
