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
      `INSERT INTO contact_messages (nombre, email, mensaje)
       VALUES (?, ?, ?)`,
      [nombre, email, mensaje]
    );

    return res.status(201).json({ message: "Mensaje enviado correctamente" });

  } catch (err) {
    console.error("crearMensaje:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
};

/* ============================================================
   GET /contacto
   Admin — listado para panel
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

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
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
   Admin — badge + métricas
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
   Admin — marcar como leído
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
   Admin — soft delete
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

/* ============================================================
   POST /contacto/:id/reply
   Admin — base para responder por mail
============================================================ */

exports.responderPorMail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const subject = clean(req.body.subject);
    const body = clean(req.body.body);

    if (!id || !subject || !body) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const [[msg]] = await db.query(
      `
      SELECT email, nombre
      FROM contact_messages
      WHERE id = ? AND eliminado = 0
      `,
      [id]
    );

    if (!msg) {
      return res.status(404).json({ message: "Mensaje no encontrado" });
    }

    // 🚧 Envío de mail pendiente (MailerSend / SendGrid)
    // await mailer.send({ to: msg.email, subject, html: body });

    await db.query(
      `
      UPDATE contact_messages
      SET respondido = 1, responded_at = NOW()
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      message: "Respuesta registrada (envío de mail pendiente)",
      to: msg.email,
      nombre: msg.nombre,
    });

  } catch (err) {
    console.error("responderPorMail:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
};
