const db = require("../db");

/* ============================================================
   Helpers
============================================================ */

const clean = (v) => String(v ?? "").trim();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ============================================================
   POST /contacto
   Público — enviar mensaje
============================================================ */

exports.crearMensaje = async (req, res) => {
  try {
    const nombre = clean(req.body.nombre);
    const email = clean(req.body.email).toLowerCase();
    const mensaje = clean(req.body.mensaje);

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email inválido" });
    }

    await db.query(
      `
      INSERT INTO contact_messages (nombre, email, mensaje)
      VALUES (?, ?, ?)
      `,
      [nombre, email, mensaje]
    );

    return res.json({ message: "Mensaje enviado correctamente" });

  } catch (err) {
    console.error("crearMensaje:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
};

/* ============================================================
   GET /contacto
   Admin — listado
============================================================ */

exports.listarMensajes = async (req, res) => {
  try {
    const unread = String(req.query.unread) === "1";
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    let sql = `
      SELECT *
      FROM v_contact_admin_list
    `;

    const params = [];

    if (unread) {
      sql += ` WHERE leido = 0`;
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);

    return res.json(rows);

  } catch (err) {
    console.error("listarMensajes:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
};

/* ============================================================
   GET /contacto/counts
============================================================ */

exports.obtenerCounts = async (req, res) => {
  try {
    const [[counts]] = await db.query(
      `SELECT * FROM v_contact_admin_counts`
    );

    return res.json({
      total: Number(counts.total_mensajes),
      activos: Number(counts.total_activos),
      no_leidos: Number(counts.no_leidos),
      pendientes_respuesta: Number(counts.pendientes_respuesta),
    });

  } catch (err) {
    console.error("obtenerCounts:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
};

/* ============================================================
   PUT /contacto/:id/leido
============================================================ */

exports.marcarLeido = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const [result] = await db.query(
      `
      UPDATE contact_messages
      SET leido = 1
      WHERE id = ? AND eliminado = 0
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mensaje no encontrado" });
    }

    return res.json({ message: "Mensaje marcado como leído" });

  } catch (err) {
    console.error("marcarLeido:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
};

/* ============================================================
   DELETE /contacto/:id
============================================================ */

exports.eliminarMensaje = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const [result] = await db.query(
      `
      UPDATE contact_messages
      SET eliminado = 1
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mensaje no encontrado" });
    }

    return res.json({ message: "Mensaje eliminado" });

  } catch (err) {
    console.error("eliminarMensaje:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
};
