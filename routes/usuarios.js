const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/usuariosController');

// AUTH
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// PERFIL
router.get('/me', auth, ctrl.getMe);

// PASSWORD
router.put('/cambiar-password', auth, ctrl.cambiarPassword);

// AVATAR
router.put('/actualizar-foto', auth, ctrl.actualizarFoto);

module.exports = router;
