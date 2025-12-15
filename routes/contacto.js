const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');

// 📩 CREAR MENSAJE (PÚBLICO)
router.post('/', contactoController.enviarMensaje);

// 📬 LISTAR MENSAJES (ADMIN)
router.get('/', contactoController.obtenerMensajes);

// 🔢 COUNTS (ADMIN)
router.get('/counts', contactoController.obtenerCounts);

// ✅ MARCAR LEÍDO (ADMIN)
router.put('/:id/leido', contactoController.marcarLeido);

// 🗑 ELIMINAR (ADMIN)
router.delete('/:id', contactoController.eliminarMensaje);

module.exports = router;
