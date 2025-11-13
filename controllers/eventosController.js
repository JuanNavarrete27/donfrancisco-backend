
const db = require('../db');
exports.obtenerEventos = async (req, res) => {
  try { const [rows] = await db.query('SELECT * FROM eventos ORDER BY fecha DESC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.crearEvento = async (req, res) => {
  const { titulo, descripcion, fecha, estado } = req.body;
  try { await db.query('INSERT INTO eventos (titulo, descripcion, fecha, estado) VALUES (?, ?, ?, ?)', [titulo, descripcion, fecha, estado || 'ACTIVO']); res.json({ mensaje: 'Evento creado' }); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};


// Auto-generated stubs for missing exports
exports.obtenerEventos = (req,res) => res.status(501).json({'error':'obtenerEventos not implemented'});
exports.crearEvento = (req,res) => res.status(501).json({'error':'crearEvento not implemented'});
exports.actualizarEvento = (req,res) => res.status(501).json({'error':'actualizarEvento not implemented'});
exports.eliminarEvento = (req,res) => res.status(501).json({'error':'eliminarEvento not implemented'});
