// routes/usuarios.js → VERSIÓN FINAL, LIMPIA Y FUNCIONAL (sin duplicados)
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');
const db = require('../db');
const bcrypt = require('bcryptjs');

// =============================================================
// AUTH PÚBLICO
// =============================================================
router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);

// =============================================================
// USUARIO LOGUEADO
// =============================================================

// Perfil completo (incluye foto y created_at)
router.get('/me', auth, ctrl.getMiPerfil);

// Cambiar contraseña
router.put('/change-password', auth, async (req, res) => {
  const { actual, nueva } = req.body;
  if (!actual || !nueva) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valido = bcrypt.compareSync(actual, rows[0].password);
    if (!valido) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hash = bcrypt.hashSync(nueva, 10);
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error change-password:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Subir foto de perfil (base64)
router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;
  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Formato de imagen inválido' });
  }

  try {
    await db.query('UPDATE usuarios SET foto = ? WHERE id = ?', [foto, req.user.id]);
    res.json({ mensaje: 'Foto actualizada', foto });
  } catch (err) {
    console.error('Error al guardar foto:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// =============================================================
// ADMIN ONLY
// =============================================================
router.get('/',    auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);

module.exports = router;
