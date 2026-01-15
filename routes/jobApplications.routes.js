// routes/jobApplications.routes.js
// ============================================================
// DON FRANCISCO — FTP Empleo (Aplicaciones) Routes
// Base sugerida: /api/admin/empleo
//
// Roles:
//  - admin: CRUD + export
//  - otros: ver + export
// ============================================================

const express = require("express");
const controller = require("../controllers/jobApplications.controller");

// ✅ middlewares
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/role");

const router = express.Router();

// ------------------------------------------------------------
// ROLES (ajustá si usás otros nombres)
// ------------------------------------------------------------
// ✅ VIEW: cualquiera que pueda entrar a ver y exportar
const ROLES_VIEW = [
  "admin",
  "staff",
  "user",           // ✅ agregado (clave)
  "funcionario",
  "rrhh",
  "manager",
];

// ✅ ADMIN: solo admin
const ROLES_ADMIN = ["admin"];

// ------------------------------------------------------------
// ✅ VALIDACIÓN EXTRA para que no explote Express
// ------------------------------------------------------------
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

// ============================================================
// GET LIST (ver)
// GET /applications?query=&prequal=&area=&limit=&offset=
// ============================================================
router.get(
  "/applications",
  authRequired,
  requireRole(...ROLES_VIEW),
  controller.list
);

// ============================================================
// ✅ EXPORT CSV (ver + export)
// ⚠️ IMPORTANTE: debe estar ANTES de /applications/:id
// GET /applications/export.csv?query=&prequal=&area=
// ============================================================
router.get(
  "/applications/export.csv",
  authRequired,
  requireRole(...ROLES_VIEW),
  controller.exportCsv
);

// ============================================================
// GET ONE (ver)
// GET /applications/:id
// ============================================================
router.get(
  "/applications/:id",
  authRequired,
  requireRole(...ROLES_VIEW),
  controller.getById
);

// ============================================================
// CREATE (admin only)
// POST /applications
// ============================================================
router.post(
  "/applications",
  authRequired,
  requireRole(...ROLES_ADMIN),
  controller.create
);

// ============================================================
// UPDATE (admin only)
// PUT /applications/:id
// ============================================================
router.put(
  "/applications/:id",
  authRequired,
  requireRole(...ROLES_ADMIN),
  controller.update
);

// ============================================================
// DELETE (admin only)
// DELETE /applications/:id
// ============================================================
router.delete(
  "/applications/:id",
  authRequired,
  requireRole(...ROLES_ADMIN),
  controller.remove
);

module.exports = router;
