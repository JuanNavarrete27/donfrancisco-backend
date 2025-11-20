// routes/usuarios.js → VERSIÓN FINAL 100% FUNCIONAL
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');
const db = require('../db');
const bcrypt = require('bcryptjs');

// AUTH
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// USUARIO LOGUEADO
router.get('/me', auth, (req, res) => {
  res.json({
    id: req.user.id,
    nombre: req.user.nombre || '',
    apellido: req.user.apellido || '',
    email: req.user.email,
    rol: req.user.rol,
    foto: req.user.foto || null,
    created_at: req.user.created_at || null
  });
});

router.put('/change-password', auth, async (req, res) => {
  const { actual, nueva } = req.body;
  if (!actual || !nueva) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(actual, rows[0].password)) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    const hash = bcrypt.hashSync(nueva, 10);
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;
  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Foto inválida' });
  }
  try {
    await db.query('UPDATE usuarios SET foto = ? WHERE id = ?', [foto, req.user.id]);
    res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar foto' });
  }
});

// ADMIN
router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);

module.exports = router;
