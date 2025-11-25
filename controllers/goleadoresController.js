const db = require('../db');

exports.obtenerGoleadores = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM goleadores ORDER BY goles DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en obtenerGoleadores:', err);
    res.status(500).json({ error: 'DB error' });
  }
};

exports.agregarGoleador = async (req, res) => {
  const { nombre, equipo, goles } = req.body;

  try {
    await db.query(
      'INSERT INTO goleadores (nombre, equipo, goles) VALUES (?, ?, ?)',
      [nombre, equipo, goles]
    );
    res.json({ mensaje: 'Goleador agregado' });
  } catch (err) {
    console.error('Error en agregarGoleador:', err);
    res.status(500).json({ error: 'DB error' });
  }
};

exports.actualizarGoleador = async (req, res) => {
  const { id } = req.params;
  const { nombre, equipo, goles } = req.body;

  try {
    await db.query(
      'UPDATE goleadores SET nombre=?, equipo=?, goles=? WHERE id=?',
      [nombre, equipo, goles, id]
    );
    res.json({ mensaje: 'Goleador actualizado' });
  } catch (err) {
    console.error('Error en actualizarGoleador:', err);
    res.status(500).json({ error: 'DB error' });
  }
};

exports.eliminarGoleador = async (req, res) => {
  try {
    await db.query('DELETE FROM goleadores WHERE id=?', [req.params.id]);
    res.json({ mensaje: 'Goleador eliminado' });
  } catch (err) {
    console.error('Error en eliminarGoleador:', err);
    res.status(500).json({ error: 'DB error' });
  }
};
