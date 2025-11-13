
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/goleadoresController');

router.get('/', ctrl.obtenerGoleadores);
router.post('/', auth, soloAdmin, ctrl.agregarGoleador);
router.put('/:id', auth, soloAdmin, ctrl.actualizarGoleador);
router.delete('/:id', auth, soloAdmin, ctrl.eliminarGoleador);

module.exports = router;
