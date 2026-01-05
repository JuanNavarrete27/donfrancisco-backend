const db = require("../db");

/* ============================================================
   Helpers
============================================================ */

const clean = (v) => String(v ?? "").trim();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const safeLimit = (value, defaultValue = 30, max = 200) => {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) {
    return Math.min(n, max);
  }
  return defaultValue;
};

const safeOffset = (value, defaultValue = 0) => {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) {
    return n;
  }
  return defaultValue;
};

const handleError = (res, err, code = "SERVER_ERROR", status = 500) => {
  console.error(code + ":", err);
  return res.status(status).json({
    ok: false,
    error: {
      code,
      message: status === 500 ? "Error del servidor" : String(code),
    },
  });
};

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
      return res.status(400).json({
        ok: false,
        error: { code: "MISSING_FIELDS", message: "Datos incompletos" },
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_EMAIL", message: "Email inválido" },
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO contact_messages (nombre, email, mensaje)
      VALUES (?, ?, ?)
      `,
      [nombre, email, mensaje]
    );

    return res.status(201).json({
      ok: true,
      data: {
        id: result.insertId,
        message: "Mensaje enviado correctamente",
      },
    });
  } catch (err) {
    return handleError(res, err, "CREAR_MENSAJE_ERROR");
  }
};

/* ============================================================
   GET /contacto
   Admin — listado
============================================================ */

exports.listarMensajes = async (req, res) => {
  try {
    const unread = String(req.query.unread) === "1";
    const limit = safeLimit(req.query.limit);
    const offset = safeOffset(req.query.offset);

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

    const [[counts]] = await db.query(
      `SELECT * FROM v_contact_admin_counts`
    );

    const total = Number(counts?.total_mensajes ?? 0);
    const [rows] = await db.query(sql, params);

    return res.json({
      ok: true,
      data: {
        items: rows,
        limit,
        offset,
        total,
      },
    });
  } catch (err) {
    return handleError(res, err, "LISTAR_MENSAJES_ERROR");
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
      ok: true,
      data: {
        total: Number(counts?.total_mensajes ?? 0),
        activos: Number(counts?.total_activos ?? 0),
        no_leidos: Number(counts?.no_leidos ?? 0),
        pendientes_respuesta: Number(counts?.pendientes_respuesta ?? 0),
      },
    });
  } catch (err) {
    return handleError(res, err, "OBTENER_COUNTS_ERROR");
  }
};

/* ============================================================
   PUT /contacto/:id/leido
============================================================ */

exports.marcarLeido = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_ID", message: "ID inválido" },
      });
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
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Mensaje no encontrado" },
      });
    }

    return res.json({
      ok: true,
      data: { message: "Mensaje marcado como leído" },
    });
  } catch (err) {
    return handleError(res, err, "MARCAR_LEIDO_ERROR");
  }
};

/* ============================================================
   DELETE /contacto/:id
============================================================ */

exports.eliminarMensaje = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_ID", message: "ID inválido" },
      });
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
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Mensaje no encontrado" },
      });
    }

    return res.json({
      ok: true,
      data: { message: "Mensaje eliminado" },
    });
  } catch (err) {
    return handleError(res, err, "ELIMINAR_MENSAJE_ERROR");
  }
};
