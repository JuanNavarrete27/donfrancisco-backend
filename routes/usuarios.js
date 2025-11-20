// routes/usuarios.js → TU VERSIÓN ORIGINAL + SOLO ESTO AL FINAL
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');

// ← TU CÓDIGO ORIGINAL (NO TOCAR)
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);

// ← SOLO AGREGÁ ESTAS 2 RUTAS AL FINAL
router.get('/me', auth, (req, res) => {
  res.json(req.user); // tu auth.js original ya pone todo en req.user
});

router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;
  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Foto inválida' });
  }
  try {
    await require('../db').query('UPDATE usuarios SET foto = ? WHERE id = ?', [foto, req.user.id]);
    res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar foto' });
  }
});

module.exports = router;
