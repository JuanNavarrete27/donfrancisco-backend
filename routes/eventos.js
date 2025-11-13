
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/eventosController');

router.get('/', ctrl.obtenerEventos);
router.post('/', auth, soloAdmin, ctrl.crearEvento);
router.put('/:id', auth, soloAdmin, ctrl.actualizarEvento);
router.delete('/:id', auth, soloAdmin, ctrl.eliminarEvento);

module.exports = router;
