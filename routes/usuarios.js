
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);

module.exports = router;
