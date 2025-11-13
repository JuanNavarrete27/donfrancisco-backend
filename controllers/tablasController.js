
const db = require('../db');
exports.obtenerTablaAnual = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tabla_anual ORDER BY posicion ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.obtenerTablaClausura = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tabla_clausura ORDER BY posicion ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.agregarEquipoAnual = async (req, res) => {
  const { equipo,puntos,goles_favor,goles_contra,posicion } = req.body;
  try { await db.query('INSERT INTO tabla_anual (equipo,puntos,goles_favor,goles_contra,posicion) VALUES (?, ?, ?, ?, ?)', [equipo,puntos,goles_favor,goles_contra,posicion]); res.json({ mensaje: 'Equipo agregado' }); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.actualizarEquipoAnual = async (req, res) => {
  const { id } = req.params; const { equipo,puntos,goles_favor,goles_contra,posicion } = req.body;
  try { await db.query('UPDATE tabla_anual SET equipo=?, puntos=?, goles_favor=?, goles_contra=?, posicion=? WHERE id=?', [equipo,puntos,goles_favor,goles_contra,posicion,id]); res.json({ mensaje: 'Equipo actualizado' }); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};
exports.eliminarEquipoAnual = async (req, res) => {
  try { await db.query('DELETE FROM tabla_anual WHERE id=?', [req.params.id]); res.json({ mensaje: 'Equipo eliminado' }); }
  catch (err) { res.status(500).json({ error: 'DB error' }); }
};


// Auto-generated stubs for missing exports
exports.obtenerTablaAnual = (req,res) => res.status(501).json({'error':'obtenerTablaAnual not implemented'});
exports.obtenerTablaClausura = (req,res) => res.status(501).json({'error':'obtenerTablaClausura not implemented'});
exports.agregarEquipoAnual = (req,res) => res.status(501).json({'error':'agregarEquipoAnual not implemented'});
exports.actualizarEquipoAnual = (req,res) => res.status(501).json({'error':'actualizarEquipoAnual not implemented'});
exports.eliminarEquipoAnual = (req,res) => res.status(501).json({'error':'eliminarEquipoAnual not implemented'});
