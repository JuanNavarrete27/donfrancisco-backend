const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');

// ✅ auth + roles
const { authRequired } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

const ROLES_READ = ['admin', 'funcionario'];
const ROLES_ADMIN = ['admin'];

// 📩 CREAR MENSAJE (PÚBLICO)
router.post('/', contactoController.crearMensaje);

// 📬 LISTAR MENSAJES (ADMIN + FUNCIONARIO = solo lectura)
router.get(
  '/',
  authRequired,
  requireRole(...ROLES_READ),
  contactoController.listarMensajes
);

// 🔢 COUNTS (ADMIN + FUNCIONARIO = lectura)
router.get(
  '/counts',
  authRequired,
  requireRole(...ROLES_READ),
  contactoController.obtenerCounts
);

// ✅ MARCAR LEÍDO (SOLO ADMIN)
router.put(
  '/:id/leido',
  authRequired,
  requireRole(...ROLES_ADMIN),
  contactoController.marcarLeido
);

// 🗑 ELIMINAR (SOLO ADMIN)
router.delete(
  '/:id',
  authRequired,
  requireRole(...ROLES_ADMIN),
  contactoController.eliminarMensaje
);

module.exports = router;
