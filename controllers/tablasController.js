const db = require('../db');

// ===============================
// GET tabla anual
// ===============================
exports.obtenerTablaAnual = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tabla_anual ORDER BY posicion ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en obtenerTablaAnual:', err);
    res.status(500).json({ error: 'Error al obtener tabla anual' });
  }
};

// ===============================
// GET tabla clausura
// ===============================
exports.obtenerTablaClausura = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tabla_clausura ORDER BY posicion ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en obtenerTablaClausura:', err);
    res.status(500).json({ error: 'Error al obtener clausura' });
  }
};

// ===============================
// POST nuevo equipo anual
// ===============================
exports.agregarEquipoAnual = async (req, res) => {
  try {
    const { equipo, puntos, goles_favor, goles_contra, posicion } = req.body;

    if (!equipo || equipo.trim() === "") {
      return res
        .status(400)
        .json({ error: 'El nombre del equipo es obligatorio' });
    }

    await db.query(
      `INSERT INTO tabla_anual 
        (equipo, puntos, goles_favor, goles_contra, posicion)
       VALUES (?, ?, ?, ?, ?)`,
      [
        equipo,
        puntos ?? 0,
        goles_favor ?? 0,
        goles_contra ?? 0,
        posicion ?? null
      ]
    );

    // 🔥 RESPUESTA QUE ESPERA EL FRONT
    res.json({ mensaje: 'Equipo agregado', ok: true });
  } catch (err) {
    console.error('Error en agregarEquipoAnual:', err);
    res.status(500).json({ error: 'Error al agregar equipo' });
  }
};

// ===============================
// PUT actualizar equipo anual
// ===============================
exports.actualizarEquipoAnual = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipo, puntos, goles_favor, goles_contra, posicion } = req.body;

    await db.query(
      `UPDATE tabla_anual 
       SET equipo=?, puntos=?, goles_favor=?, goles_contra=?, posicion=? 
       WHERE id=?`,
      [
        equipo,
        puntos ?? 0,
        goles_favor ?? 0,
        goles_contra ?? 0,
        posicion ?? null,
        id
      ]
    );

    // 🔥 RESPUESTA QUE ESPERA EL FRONT
    res.json({ mensaje: 'Equipo actualizado', ok: true });
  } catch (err) {
    console.error('Error en actualizarEquipoAnual:', err);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

// ===============================
// DELETE equipo anual
// ===============================
exports.eliminarEquipoAnual = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM tabla_anual WHERE id=?', [id]);

    // 🔥 RESPUESTA QUE ESPERA EL FRONT
    res.json({ mensaje: 'Equipo eliminado', ok: true });
  } catch (err) {
    console.error('Error en eliminarEquipoAnual:', err);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
};
