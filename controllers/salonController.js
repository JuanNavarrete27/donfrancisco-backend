// controllers/salonController.js
const db = require("../db"); // tu pool mysql2/promise

// -------------------------
// helpers de tiempo
// -------------------------
function normalizeTime(t) {
  // acepta "13:00" o "13:00:00"
  if (!t) return null;
  const s = String(t).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}$/.test(s)) return s + ":00";
  return null;
}

function timeToMinutes(t) {
  const nt = normalizeTime(t);
  if (!nt) return null;
  const [hh, mm] = nt.split(":").map(Number);
  return hh * 60 + mm;
}

function minutesToTime(min) {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  const HH = String(hh).padStart(2, "0");
  const MM = String(mm).padStart(2, "0");
  return `${HH}:${MM}:00`;
}

function buildHourlySlots(horaInicio, horaFin) {
  // fin es EXCLUSIVO: 13 -> 16 => 13,14,15
  const startMin = timeToMinutes(horaInicio);
  const endMin = timeToMinutes(horaFin);

  if (startMin == null || endMin == null) return { ok: false, error: "Hora inválida." };
  if (endMin <= startMin) return { ok: false, error: "hora_fin debe ser mayor que hora_inicio." };

  // si querés SOLO horas exactas, exigimos minutos 00
  if (startMin % 60 !== 0 || endMin % 60 !== 0) {
    return { ok: false, error: "Solo se permiten horas exactas (ej: 13:00)." };
  }

  const slots = [];
  for (let m = startMin; m < endMin; m += 60) slots.push(minutesToTime(m));
  return { ok: true, slots };
}

// -------------------------
// middleware simple para admin
// -------------------------
exports.adminAuth = (req, res, next) => {
  const key = req.header("x-admin-key");
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ ok: false, error: "Falta ADMIN_KEY en env." });
  }
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: "No autorizado." });
  }
  next();
};

// -------------------------
// POST /api/salon/solicitudes
// body: { fecha:"YYYY-MM-DD", hora_inicio:"13:00", hora_fin:"16:00", nombre, apellido, telefono, email, mensaje? }
// -------------------------
exports.crearSolicitud = async (req, res) => {
  try {
    const {
      fecha,
      hora_inicio,
      hora_fin,
      nombre,
      apellido,
      telefono,
      email,
      mensaje
    } = req.body || {};

    if (!fecha || !hora_inicio || !hora_fin || !nombre || !apellido || !telefono || !email) {
      return res.status(400).json({ ok: false, error: "Faltan campos obligatorios." });
    }

    const built = buildHourlySlots(hora_inicio, hora_fin);
    if (!built.ok) return res.status(400).json({ ok: false, error: built.error });

    // horas_json se guarda como JSON (array)
    const horasJson = JSON.stringify(built.slots);

    const sql = `
      INSERT INTO salon_solicitudes
      (fecha, hora_inicio, hora_fin, horas_json, estado, nombre, apellido, telefono, email, mensaje)
      VALUES (?, ?, ?, CAST(? AS JSON), 'pending', ?, ?, ?, ?, ?)
    `;

    const [r] = await db.execute(sql, [
      fecha,
      normalizeTime(hora_inicio),
      normalizeTime(hora_fin),
      horasJson,
      String(nombre).trim(),
      String(apellido).trim(),
      String(telefono).trim(),
      String(email).trim(),
      mensaje ? String(mensaje).trim() : null,
    ]);

    return res.json({ ok: true, id: r.insertId });
  } catch (e) {
    console.error("crearSolicitud error:", e);
    return res.status(500).json({ ok: false, error: "Error creando solicitud." });
  }
};

// -------------------------
// GET /api/salon/reservas?fecha=YYYY-MM-DD
// devuelve: { horasOcupadas: ["13:00:00","14:00:00"] }
// -------------------------
exports.getReservasPorFecha = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ ok: false, error: "Falta fecha." });

    const [rows] = await db.execute(
      `SELECT hora FROM salon_reservas WHERE fecha = ? ORDER BY hora ASC`,
      [fecha]
    );

    return res.json({ ok: true, horasOcupadas: rows.map(r => r.hora) });
  } catch (e) {
    console.error("getReservasPorFecha error:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo reservas." });
  }
};

// -------------------------
// GET /api/admin/salon/solicitudes?estado=pending|approved|rejected
// -------------------------
exports.adminListSolicitudes = async (req, res) => {
  try {
    const estado = (req.query.estado || "pending").toString();
    const allowed = new Set(["pending", "approved", "rejected"]);
    if (!allowed.has(estado)) return res.status(400).json({ ok: false, error: "Estado inválido." });

    const [rows] = await db.execute(
      `SELECT *
       FROM salon_solicitudes
       WHERE estado = ?
       ORDER BY created_at DESC`,
      [estado]
    );

    return res.json({ ok: true, items: rows });
  } catch (e) {
    console.error("adminListSolicitudes error:", e);
    return res.status(500).json({ ok: false, error: "Error listando solicitudes." });
  }
};

// -------------------------
// POST /api/admin/salon/solicitudes/:id/approve
// aprueba y bloquea horas en salon_reservas (una fila por hora)
// -------------------------
exports.adminApproveSolicitud = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "ID inválido." });

    await conn.beginTransaction();

    // 1) traigo solicitud con lock
    const [solRows] = await conn.execute(
      `SELECT id, fecha, horas_json, estado
       FROM salon_solicitudes
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    if (!solRows.length) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "Solicitud no existe." });
    }

    const sol = solRows[0];
    if (sol.estado !== "pending") {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "La solicitud no está en pending." });
    }

    // horas_json viene como objeto/array o string según driver
    const horas = Array.isArray(sol.horas_json)
      ? sol.horas_json
      : JSON.parse(sol.horas_json);

    const slots = (horas || []).map(normalizeTime).filter(Boolean);

    if (!slots.length) {
      await conn.rollback();
      return res.status(400).json({ ok: false, error: "horas_json inválido/vacío." });
    }

    // 2) chequear choques con aprobadas (salon_reservas)
    // armamos IN dinámico
    const inPlaceholders = slots.map(() => "?").join(", ");
    const [conflicts] = await conn.execute(
      `SELECT hora FROM salon_reservas
       WHERE fecha = ? AND hora IN (${inPlaceholders})
       LIMIT 1`,
      [sol.fecha, ...slots]
    );

    if (conflicts.length) {
      await conn.rollback();
      return res.status(409).json({
        ok: false,
        error: `Choque: ya hay una reserva aprobada en ${conflicts[0].hora}.`
      });
    }

    // 3) insertar reservas (bulk insert)
    const values = [];
    const params = [];
    for (const h of slots) {
      values.push("(?, ?, ?)");
      params.push(id, sol.fecha, h);
    }

    await conn.execute(
      `INSERT INTO salon_reservas (solicitud_id, fecha, hora)
       VALUES ${values.join(", ")}`,
      params
    );

    // 4) marcar solicitud aprobada
    await conn.execute(
      `UPDATE salon_solicitudes SET estado = 'approved' WHERE id = ?`,
      [id]
    );

    await conn.commit();
    return res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("adminApproveSolicitud error:", e);
    return res.status(500).json({ ok: false, error: "Error aprobando solicitud." });
  } finally {
    conn.release();
  }
};

// -------------------------
// POST /api/admin/salon/solicitudes/:id/reject
// -------------------------
exports.adminRejectSolicitud = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "ID inválido." });

    const [r] = await db.execute(
      `UPDATE salon_solicitudes
       SET estado = 'rejected'
       WHERE id = ? AND estado = 'pending'`,
      [id]
    );

    if (r.affectedRows === 0) {
      return res.status(409).json({ ok: false, error: "Solo podés rechazar si está pending." });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("adminRejectSolicitud error:", e);
    return res.status(500).json({ ok: false, error: "Error rechazando solicitud." });
  }
};
