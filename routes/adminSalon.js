// routes/adminSalon.js
const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middlewares/auth");
const soloAdmin = require("../middlewares/soloAdmin");

// ==============================
// Helpers (mismo criterio)
// ==============================
function timeToMinutes(t) {
  const [hh, mm] = String(t || "").split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}
function minutesToTime(min) {
  const hh = String(Math.floor(min / 60)).padStart(2, "0");
  const mm = String(min % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
function buildHoras(inicio, fin) {
  const start = timeToMinutes(inicio);
  const end = timeToMinutes(fin);
  if (start == null || end == null) return null;
  if (end <= start) return null;
  const step = 60;
  const horas = [];
  for (let m = start; m < end; m += step) horas.push(minutesToTime(m));
  return horas;
}

// ✅ Protegemos TODO el router admin
router.use(auth, soloAdmin);

// ==============================
// GET /admin/salon/solicitudes?estado=...
// ==============================
router.get("/solicitudes", async (req, res) => {
  try {
    const { estado } = req.query;

    let sql = `
      SELECT
        id, fecha,
        TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
        TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin,
        horas_json, estado,
        nombre, apellido, telefono, email, mensaje,
        created_at
      FROM salon_solicitudes
    `;
    const params = [];

    if (estado) {
      sql += ` WHERE estado = ? `;
      params.push(estado);
    }

    sql += ` ORDER BY created_at DESC `;

    const [rows] = await db.execute(sql, params);
    return res.json({ ok: true, items: rows });
  } catch (e) {
    console.error("GET /admin/salon/solicitudes error:", e);
    return res.status(500).json({ ok: false, error: "Error listando solicitudes." });
  }
});

// ==============================
// GET /admin/salon/solicitudes/:id
// ==============================
router.get("/solicitudes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        id, fecha,
        TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
        TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin,
        horas_json, estado,
        nombre, apellido, telefono, email, mensaje,
        created_at
      FROM salon_solicitudes
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    const item = rows?.[0];
    if (!item) return res.status(404).json({ ok: false, error: "Solicitud no encontrada." });

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("GET /admin/salon/solicitudes/:id error:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo solicitud." });
  }
});

// ==============================
// POST /admin/salon/solicitudes/:id/aprobar
// - valida conflictos contra salon_reservas
// - si no hay, inserta UNA FILA POR HORA
// - actualiza solicitud a approved
// ==============================
router.post("/solicitudes/:id/aprobar", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;

    await conn.beginTransaction();

    // 1) Traer solicitud
    const [rows] = await conn.execute(
      `
      SELECT id, fecha, hora_inicio, hora_fin, horas_json, estado
      FROM salon_solicitudes
      WHERE id = ?
      FOR UPDATE
      `,
      [id]
    );

    const sol = rows?.[0];
    if (!sol) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "Solicitud no encontrada." });
    }
    if (sol.estado !== "pending") {
      await conn.rollback();
      return res.status(400).json({ ok: false, error: "La solicitud no está en pending." });
    }

    // 2) Horas a bloquear
    let horas = null;
    try {
      horas = sol.horas_json ? JSON.parse(sol.horas_json) : null;
    } catch {
      horas = null;
    }
    if (!Array.isArray(horas) || horas.length === 0) {
      const inicio = String(sol.hora_inicio).slice(0, 5);
      const fin = String(sol.hora_fin).slice(0, 5);
      horas = buildHoras(inicio, fin);
    }
    if (!Array.isArray(horas) || horas.length === 0) {
      await conn.rollback();
      return res.status(400).json({ ok: false, error: "Horas inválidas en la solicitud." });
    }

    // 3) Chequear conflictos (ya aprobado bloquea)
    const [conflicts] = await conn.execute(
      `
      SELECT TIME_FORMAT(hora, '%H:%i') AS hora
      FROM salon_reservas
      WHERE fecha = ?
        AND hora IN (${horas.map(() => "TIME(?)").join(",")})
      `,
      [sol.fecha, ...horas]
    );

    if (conflicts.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        ok: false,
        error: "Conflicto: algunas horas ya están reservadas.",
        horas_conflictivas: conflicts.map((c) => c.hora),
      });
    }

    // 4) Insertar reservas (una fila por hora)
    // Nota: en MySQL TIME(?) funciona si pasás "HH:MM"
    for (const h of horas) {
      await conn.execute(
        `
        INSERT INTO salon_reservas (solicitud_id, fecha, hora)
        VALUES (?, ?, TIME(?))
        `,
        [sol.id, sol.fecha, h]
      );
    }

    // 5) Marcar solicitud approved
    await conn.execute(
      `
      UPDATE salon_solicitudes
      SET estado = 'approved'
      WHERE id = ?
      `,
      [sol.id]
    );

    await conn.commit();

    return res.json({
      ok: true,
      message: "Solicitud aprobada y horas bloqueadas.",
      id: sol.id,
      fecha: sol.fecha,
      horas,
    });
  } catch (e) {
    await conn.rollback();
    console.error("POST /admin/salon/solicitudes/:id/aprobar error:", e);
    return res.status(500).json({ ok: false, error: "Error aprobando solicitud." });
  } finally {
    conn.release();
  }
});

// ==============================
// POST /admin/salon/solicitudes/:id/rechazar
// ==============================
router.post("/solicitudes/:id/rechazar", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `
      UPDATE salon_solicitudes
      SET estado = 'rejected'
      WHERE id = ? AND estado = 'pending'
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ ok: false, error: "No se pudo rechazar (no existe o no está pending)." });
    }

    return res.json({ ok: true, message: "Solicitud rechazada." });
  } catch (e) {
    console.error("POST /admin/salon/solicitudes/:id/rechazar error:", e);
    return res.status(500).json({ ok: false, error: "Error rechazando solicitud." });
  }
});

module.exports = router;
