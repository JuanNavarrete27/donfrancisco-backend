const express = require('express');
const router = express.Router();
const tablasController = require('../controllers/tablasController');

// GET tabla (anual o clausura)
router.get('/:tipo', tablasController.obtenerTabla);

// POST agregar equipo
router.post('/', tablasController.agregarEquipo);

// PUT actualizar equipo
router.put('/:id', tablasController.actualizarEquipo);

// DELETE eliminar equipo
router.delete('/:id', tablasController.eliminarEquipo);

module.exports = router;
