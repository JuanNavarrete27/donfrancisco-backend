const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/usuariosController');

// -------------------------
// AUTH PÚBLICO
// -------------------------
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// -------------------------
// PERFIL LOGUEADO
// -------------------------
router.get('/me', auth, ctrl.getMe);

// -------------------------
// CAMBIAR PASSWORD
// -------------------------
router.put('/cambiar-password', auth, ctrl.cambiarPassword);

// -------------------------
// ACTUALIZAR AVATAR
// -------------------------
router.put('/actualizar-foto', auth, ctrl.actualizarFoto);

module.exports = router;
