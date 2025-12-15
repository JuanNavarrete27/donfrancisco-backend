const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const adminOnly = require("../middlewares/adminOnly");
const contactoController = require("../controllers/contactoController");

/* ============================================================
   RUTAS PÚBLICAS
============================================================ */

/**
 * Enviar mensaje de contacto
 * POST /contacto
 */
router.post(
  "/",
  contactoController.enviarMensaje
);

/* ============================================================
   RUTAS ADMIN
============================================================ */

/**
 * Listado de mensajes (panel admin)
 * GET /contacto
 * Query params:
 *   - unread=1
 *   - limit
 *   - offset
 */
router.get(
  "/",
  auth,
  adminOnly,
  contactoController.obtenerMensajes
);

/**
 * Badge + métricas
 * GET /contacto/counts
 */
router.get(
  "/counts",
  auth,
  adminOnly,
  contactoController.obtenerCounts
);

/**
 * Marcar mensaje como leído
 * PUT /contacto/:id/leido
 */
router.put(
  "/:id/leido",
  auth,
  adminOnly,
  contactoController.marcarLeido
);

/**
 * Eliminar mensaje (soft delete)
 * DELETE /contacto/:id
 */
router.delete(
  "/:id",
  auth,
  adminOnly,
  contactoController.eliminarMensaje
);

/**
 * Responder mensaje por mail (base)
 * POST /contacto/:id/reply
 */
router.post(
  "/:id/reply",
  auth,
  adminOnly,
  contactoController.responderPorMail
);

module.exports = router;
