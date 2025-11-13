
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/tablasController');

router.get('/anual', ctrl.obtenerTablaAnual);
router.get('/clausura', ctrl.obtenerTablaClausura);

router.post('/anual', auth, soloAdmin, ctrl.agregarEquipoAnual);
router.put('/anual/:id', auth, soloAdmin, ctrl.actualizarEquipoAnual);
router.delete('/anual/:id', auth, soloAdmin, ctrl.eliminarEquipoAnual);

module.exports = router;
