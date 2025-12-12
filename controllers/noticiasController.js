// controllers/noticiasController.js
const db = require("../db");

/* ============================================================
   GET TODAS LAS NOTICIAS (PÚBLICO)
============================================================ */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        titulo,
        descripcion,
        imagen,
        video_url AS videoUrl,
        fecha,
        autor
      FROM noticias
      ORDER BY fecha DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error en getAll noticias:", err);
    res.status(500).json({ error: "Error al obtener noticias" });
  }
};

/* ============================================================
   GET NOTICIA POR ID (PÚBLICO)
============================================================ */
exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        id,
        titulo,
        descripcion,
        imagen,
        video_url AS videoUrl,
        fecha,
        autor
      FROM noticias
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Noticia no encontrada" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en getById noticia:", err);
    res.status(500).json({ error: "Error al obtener noticia" });
  }
};

/* ============================================================
   CREAR NOTICIA (SOLO ADMIN)
============================================================ */
exports.create = async (req, res) => {
  const { titulo, descripcion, imagen, videoUrl, fecha, autor } = req.body;

  if (!titulo || !descripcion || !fecha || !autor)
    return res.status(400).json({ error: "Faltan datos obligatorios" });

  try {
    const [result] = await db.query(
      `
      INSERT INTO noticias
      (titulo, descripcion, imagen, video_url, fecha, autor)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        titulo,
        descripcion,
        imagen || null,
        videoUrl || null,
        fecha,
        autor
      ]
    );

    res.status(201).json({
      mensaje: "Noticia creada",
      id: result.insertId
    });
  } catch (err) {
    console.error("Error en create noticia:", err);
    res.status(500).json({ error: "Error al crear noticia" });
  }
};

/* ============================================================
   EDITAR NOTICIA (SOLO ADMIN)
============================================================ */
exports.update = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, imagen, videoUrl, fecha, autor } = req.body;

  if (!titulo || !descripcion || !fecha || !autor)
    return res.status(400).json({ error: "Faltan datos obligatorios" });

  try {
    const [result] = await db.query(
      `
      UPDATE noticias SET
        titulo = ?,
        descripcion = ?,
        imagen = ?,
        video_url = ?,
        fecha = ?,
        autor = ?
      WHERE id = ?
      `,
      [
        titulo,
        descripcion,
        imagen || null,
        videoUrl || null,
        fecha,
        autor,
        id
      ]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Noticia no encontrada" });

    res.json({ mensaje: "Noticia actualizada" });
  } catch (err) {
    console.error("Error en update noticia:", err);
    res.status(500).json({ error: "Error al actualizar noticia" });
  }
};

/* ============================================================
   ELIMINAR NOTICIA (SOLO ADMIN)
============================================================ */
exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM noticias WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Noticia no encontrada" });

    res.json({ mensaje: "Noticia eliminada" });
  } catch (err) {
    console.error("Error en delete noticia:", err);
    res.status(500).json({ error: "Error al eliminar noticia" });
  }
};
