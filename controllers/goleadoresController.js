
const db = require('../db');
exports.obtenerGoleadores = async (req, res) => {
  try { const [rows] = await db.query('SELECT * FROM goleadores ORDER BY goles DESC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.agregarGoleador = async (req, res) => {
  const { nombre,equipo,goles } = req.body;
  try { await db.query('INSERT INTO goleadores (nombre,equipo,goles) VALUES (?, ?, ?)', [nombre,equipo,goles]); res.json({ mensaje: 'Goleador agregado' }); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.actualizarGoleador = async (req, res) => {
  const { id } = req.params; const { nombre,equipo,goles } = req.body;
  try { await db.query('UPDATE goleadores SET nombre=?, equipo=?, goles=? WHERE id=?', [nombre,equipo,goles,id]); res.json({ mensaje: 'Goleador actualizado' }); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.eliminarGoleador = async (req, res) => {
  try { await db.query('DELETE FROM goleadores WHERE id=?', [req.params.id]); res.json({ mensaje: 'Goleador eliminado' }); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};


// Auto-generated stubs for missing exports
exports.obtenerGoleadores = (req,res) => res.status(501).json({'error':'obtenerGoleadores not implemented'});
exports.agregarGoleador = (req,res) => res.status(501).json({'error':'agregarGoleador not implemented'});
exports.actualizarGoleador = (req,res) => res.status(501).json({'error':'actualizarGoleador not implemented'});
exports.eliminarGoleador = (req,res) => res.status(501).json({'error':'eliminarGoleador not implemented'});
