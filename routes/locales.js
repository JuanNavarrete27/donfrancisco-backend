// routes/locales.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const ctrl = require("../controllers/localesController");

// ✅ auth + roles
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/role");

/* ============================================================
   PUBLIC ENDPOINTS (no auth required)
============================================================ */

// GET /api/public/locales - Public list of active locales
router.get("/public/locales", ctrl.getPublicLocales);

// GET /api/public/locales/:slug - Public locale detail by slug
router.get("/public/locales/:slug", ctrl.getPublicLocaleBySlug);

// GET /api/public/locales/id/:id - Public locale detail by ID
router.get("/public/locales/id/:id", ctrl.getPublicLocaleById);

// GET /api/public/locales/category/:category - Public locales by category
router.get("/public/locales/category/:category", ctrl.getPublicLocalesByCategory);

/* ============================================================
   ADMIN ENDPOINTS (admin only)
============================================================ */

// All admin routes require authentication and admin role
router.use("/admin", authRequired, requireRole("admin"));

// GET /api/admin/locales - Admin full listing with management fields
router.get("/admin/locales", ctrl.getAdminLocales);

// POST /api/admin/locales - Create locale (admin only)
router.post("/admin/locales", ctrl.createLocale);

// PATCH /api/admin/locales/:id - Update locale (admin only)
router.patch("/admin/locales/:id", ctrl.updateLocale);

// DELETE /api/admin/locales/:id - Soft delete locale (admin only)
router.delete("/admin/locales/:id", ctrl.deleteLocale);

/* ============================================================
   LOCAL USER SELF-MANAGEMENT ENDPOINTS
============================================================ */

// All local user routes require authentication and local role
router.use("/me", authRequired, requireRole("local"));

// GET /api/me/local - Get authenticated local user's assigned local
router.get("/me/local", ctrl.getMyLocal);

// PATCH /api/me/local - Update own local core fields
router.patch("/me/local", ctrl.updateMyLocal);

// GET /api/me/local/details - Get own extended details / sections
router.get("/me/local/details", ctrl.getMyLocalDetails);

// PATCH /api/me/local/details - Update own extended details / sections
router.patch("/me/local/details", ctrl.updateMyLocalDetails);

// PATCH /api/me/local/media - Update media URLs
router.patch("/me/local/media", ctrl.updateMyLocalMedia);

/* ============================================================
   LEGACY / GENERAL ENDPOINTS
============================================================ */

// GET /api/locales - List all locales (admin accessible, public safe)
router.get("/locales", authRequired, requireRole("admin", "funcionario"), ctrl.getAdminLocales);

// GET /api/locales/:id - Get locale detail (admin accessible)
router.get("/locales/:id", authRequired, requireRole("admin", "funcionario"), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Query 1: Get locale (no GROUP_CONCAT, no aggregation)
    const [locales] = await db.query(
      'SELECT * FROM locales WHERE id = ?',
      [id]
    );
    
    if (locales.length === 0) {
      return res.status(404).json({ ok: false, error: "Local no encontrado" });
    }
    
    const locale = locales[0];
    
    // Query 2: Get details rows separately (safe, no fragile JSON parsing)
    const [detailsRows] = await db.query(
      'SELECT section_key, section_type, content FROM local_details WHERE local_id = ?',
      [id]
    );
    
    // Normalize safely without JSON.parse on concatenated strings
    locale.details = ctrl.normalizeLocalDetails(detailsRows);
    
    res.json({ ok: true, data: locale });
    
  } catch (error) {
    console.error("Error getting locale:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
});

// POST /api/locales - Create locale (admin only)
router.post("/locales", authRequired, requireRole("admin"), ctrl.createLocale);

// PATCH /api/locales/:id - Update locale (admin only)
router.patch("/locales/:id", authRequired, requireRole("admin"), ctrl.updateLocale);

// DELETE /api/locales/:id - Soft delete locale (admin only)
router.delete("/locales/:id", authRequired, requireRole("admin"), ctrl.deleteLocale);

module.exports = router;
