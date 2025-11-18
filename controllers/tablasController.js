const db = require('../db');

// GET tabla anual
exports.obtenerTablaAnual = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tabla_anual ORDER BY posicion ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tabla anual' });
  }
};

// GET tabla clausura
exports.obtenerTablaClausura = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tabla_clausura ORDER BY posicion ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener clausura' });
  }
};

// POST nuevo equipo anual
exports.agregarEquipoAnual = async (req, res) => {
  const { equipo, puntos, goles_favor, goles_contra, posicion } = req.body;
  try {
    await db.query(
      'INSERT INTO tabla_anual (equipo, puntos, goles_favor, goles_contra, posicion) VALUES (?, ?, ?, ?, ?)',
      [equipo, puntos, goles_favor, goles_contra, posicion]
    );
    res.json({ mensaje: 'Equipo agregado a tabla anual' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar equipo' });
  }
};

// PUT actualizar equipo anual
exports.actualizarEquipoAnual = async (req, res) => {
  const { id } = req.params;
  const { equipo, puntos, goles_favor, goles_contra, posicion } = req.body;
  try {
    await db.query(
      'UPDATE tabla_anual SET equipo=?, puntos=?, goles_favor=?, goles_contra=?, posicion=? WHERE id=?',
      [equipo, puntos, goles_favor, goles_contra, posicion, id]
    );
    res.json({ mensaje: 'Equipo actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

// DELETE equipo anual
exports.eliminarEquipoAnual = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tabla_anual WHERE id=?', [id]);
    res.json({ mensaje: 'Equipo eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};
