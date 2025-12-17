// routes/salon.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ==============================
// Helpers horas (inicio inclusive, fin exclusive)
// 13:00 - 16:00 => ["13:00","14:00","15:00"]
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

  // Si querés permitir media hora, cambiá step a 30
  const step = 60;

  const horas = [];
  for (let m = start; m < end; m += step) {
    horas.push(minutesToTime(m));
  }
  return horas;
}

// ==============================
// POST /salon/solicitudes
// Body esperado:
// { fecha, hora_inicio, hora_fin, nombre, apellido, telefono, email, mensaje? }
// ==============================
router.post("/solicitudes", async (req, res) => {
  try {
    const {
      fecha,
      hora_inicio,
      hora_fin,
      nombre,
      apellido,
      telefono,
      email,
      mensaje = "",
    } = req.body || {};

    if (!fecha || !hora_inicio || !hora_fin || !nombre || !apellido || !telefono || !email) {
      return res.status(400).json({ ok: false, error: "Faltan datos obligatorios." });
    }

    const horas = buildHoras(hora_inicio, hora_fin);
    if (!horas || horas.length === 0) {
      return res.status(400).json({ ok: false, error: "Rango horario inválido." });
    }

    // Guardamos el rango + horas_json (para auditoría y UX)
    const horas_json = JSON.stringify(horas);

    const [result] = await db.execute(
      `
      INSERT INTO salon_solicitudes
        (fecha, hora_inicio, hora_fin, horas_json, estado, nombre, apellido, telefono, email, mensaje, created_at)
      VALUES
        (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, NOW())
      `,
      [fecha, hora_inicio, hora_fin, horas_json, nombre, apellido, telefono, email, mensaje]
    );

    return res.json({
      ok: true,
      id: result.insertId,
      fecha,
      hora_inicio,
      hora_fin,
      horas,
      estado: "pending",
    });
  } catch (e) {
    console.error("POST /salon/solicitudes error:", e);
    return res.status(500).json({ ok: false, error: "Error creando solicitud." });
  }
});

// ==============================
// GET /salon/reservas?fecha=YYYY-MM-DD
// Devuelve horas bloqueadas por aprobadas (salon_reservas)
// ==============================
router.get("/reservas", async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ ok: false, error: "Falta fecha." });
    }

    const [rows] = await db.execute(
      `
      SELECT TIME_FORMAT(hora, '%H:%i') AS hora
      FROM salon_reservas
      WHERE fecha = ?
      ORDER BY hora ASC
      `,
      [fecha]
    );

    return res.json({
      ok: true,
      fecha,
      horas: (rows || []).map((r) => r.hora),
    });
  } catch (e) {
    console.error("GET /salon/reservas error:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo reservas." });
  }
});

module.exports = router;
