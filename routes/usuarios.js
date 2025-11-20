// routes/usuarios.js → VERSIÓN FINAL QUE FUNCIONA CON TU FRONTEND
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const ctrl = require('../controllers/usuariosController');

// AUTH PÚBLICO
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// USUARIO AUTENTICADO
router.get('/me', auth, (req, res) => {
  res.json(req.user); // ← ahora devuelve TODO perfecto
});

router.put('/foto', auth, async (req, res) => {
  const { foto } = req.body;
  
  if (!foto || !foto.startsWith('data:image')) {
    return res.status(400).json({ error: 'Formato de imagen inválido' });
  }

  try {
    await require('../db').query(
      'UPDATE usuarios SET foto = ? WHERE id = ?',
      [foto, req.user.id]
    );
    
    // Actualiza req.user para que /me devuelva la foto nueva
    req.user.foto = foto;
    
    res.json({ mensaje: 'Foto actualizada correctamente', foto });
  } catch (err) {
    console.error('Error al guardar foto:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ADMIN
router.get('/', auth, soloAdmin, ctrl.listUsers);
router.get('/:id', auth, soloAdmin, ctrl.getUser);
router.put('/:id', auth, soloAdmin, ctrl.updateUser);
router.delete('/:id', auth, soloAdmin, ctrl.deleteUser);

module.exports = router;
