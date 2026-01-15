// controllers/jobApplications.controller.js
// ============================================================
// DON FRANCISCO — FTP Empleo (Aplicaciones)
// Controller: List / Get / Create / Update / Delete / Export CSV
//
// Roles:
//  - admin: CRUD + export
//  - otros: solo ver + export
//
// ✅ FIX IMPORTANTE:
// - Si la tabla job_applications NO existe, la crea automáticamente.
// - Evita el error: ER_NO_SUCH_TABLE
// ============================================================

const db = require("../db");

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const ALLOWED_PREQUAL = new Set(["A", "B", "C", "D"]);
const ALLOWED_AREAS = new Set([
  "limpieza",
  "gastronomia",
  "atencion_publico",
  "mantenimiento",
  "administracion",
]);

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function toStr(v) {
  return String(v ?? "").trim();
}

function asInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeAreas(areas) {
  let arr = areas;

  if (typeof areas === "string") {
    try {
      arr = JSON.parse(areas);
    } catch {
      arr = areas.split(",").map((s) => s.trim());
    }
  }

  if (!Array.isArray(arr)) return [];

  const cleaned = arr
    .map((a) => String(a).trim())
    .filter(Boolean)
    .filter((a) => ALLOWED_AREAS.has(a));

  return [...new Set(cleaned)];
}

function csvSafe(v) {
  const s = String(v ?? "");
  const needsQuotes = /[,"\n;]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function prettyArea(area) {
  switch (area) {
    case "limpieza":
      return "Limpieza";
    case "gastronomia":
      return "Gastronomía";
    case "atencion_publico":
      return "Atención al público";
    case "mantenimiento":
      return "Mantenimiento";
    case "administracion":
      return "Administración";
    default:
      return area;
  }
}

// ------------------------------------------------------------
// ✅ Admin guard defensivo (por si alguien toca mal el router)
// ------------------------------------------------------------
function isAdminReq(req) {
  const raw =
    req?.user?.rol ||
    req?.user?.role ||
    req?.user?.perfil ||
    req?.user?.type ||
    "";
  return String(raw).toLowerCase().trim() === "admin";
}

function requireAdminInsideController(req, res) {
  if (isAdminReq(req)) return true;

  res.status(403).json({
    ok: false,
    message: "FORBIDDEN_ADMIN_ONLY",
  });
  return false;
}

// ------------------------------------------------------------
// ✅ DB WRAPPER (mysql vs mysql2/promise)
// ------------------------------------------------------------
async function dbRows(sql, params = []) {
  const out = await db.query(sql, params);

  // mysql2/promise => [rows, fields]
  if (Array.isArray(out) && Array.isArray(out[0])) return out[0];

  // mysql => rows
  return out;
}

async function dbExec(sql, params = []) {
  const out = await db.query(sql, params);

  // mysql2/promise => [result, fields]
  if (
    Array.isArray(out) &&
    out[0] &&
    typeof out[0] === "object" &&
    !Array.isArray(out[0])
  ) {
    return out[0];
  }

  // mysql => result
  return out;
}

function parseAreasField(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;

  // mysql devuelve JSON como string en algunos casos
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

// ------------------------------------------------------------
// ✅ FIX: Crear tabla si no existe
// ------------------------------------------------------------
async function ensureTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS job_applications (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      first_name VARCHAR(80) NOT NULL,
      last_name VARCHAR(80) NOT NULL,
      age TINYINT UNSIGNED NOT NULL,
      phone VARCHAR(30) NOT NULL,
      email VARCHAR(120) NOT NULL,
      areas JSON NOT NULL,
      prequal CHAR(1) NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_created_at (created_at),
      INDEX idx_prequal (prequal),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await dbExec(sql);
  } catch (err) {
    console.warn("[job_applications] ensureTable warning:", err?.code, err?.sqlMessage);
  }
}

function isNoSuchTable(err) {
  return err?.code === "ER_NO_SUCH_TABLE" || err?.errno === 1146;
}

// ============================================================
// GET /api/admin/empleo/applications
// Query:
//  - query: string
//  - prequal: A|B|C|D
//  - area: limpieza|gastronomia|atencion_publico|mantenimiento|administracion
//  - limit: number (default 20, max 200)
//  - offset: number (default 0)
// ============================================================
async function list(req, res) {
  try {
    await ensureTable();

    const q = toStr(req.query.query);
    const prequal = toStr(req.query.prequal).toUpperCase();
    const area = toStr(req.query.area);
    const limit = clampInt(req.query.limit, 1, 200, 20);
    const offset = clampInt(req.query.offset, 0, 1000000, 0);

    const where = [];
    const params = [];

    if (q) {
      where.push(`(
        LOWER(first_name) LIKE ?
        OR LOWER(last_name) LIKE ?
        OR LOWER(email) LIKE ?
        OR LOWER(phone) LIKE ?
      )`);
      const like = `%${q.toLowerCase()}%`;
      params.push(like, like, like, like);
    }

    if (prequal && ALLOWED_PREQUAL.has(prequal)) {
      where.push(`prequal = ?`);
      params.push(prequal);
    }

    if (area && ALLOWED_AREAS.has(area)) {
      where.push(`JSON_CONTAINS(areas, JSON_QUOTE(?))`);
      params.push(area);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalSql = `
      SELECT COUNT(*) AS total
      FROM job_applications
      ${whereSql}
    `;
    const totalRows = await dbRows(totalSql, params);
    const total = Number(totalRows?.[0]?.total || 0);

    const dataSql = `
      SELECT
        id,
        first_name AS firstName,
        last_name AS lastName,
        age,
        phone,
        email,
        areas,
        prequal,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM job_applications
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ?
      OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const rows = await dbRows(dataSql, dataParams);

    const items = (rows || []).map((r) => ({
      ...r,
      areas: parseAreasField(r.areas),
    }));

    return res.json({
      ok: true,
      meta: { total, limit, offset },
      items,
    });
  } catch (err) {
    console.error("jobApplications.list error:", err);

    if (isNoSuchTable(err)) {
      return res.json({
        ok: true,
        meta: { total: 0, limit: 20, offset: 0 },
        items: [],
        warning: "Tabla job_applications no existía. Reintentá luego de crearla.",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Error listando aplicaciones.",
      code: err?.code,
      errno: err?.errno,
      sqlMessage: err?.sqlMessage,
    });
  }
}

// ============================================================
// GET /api/admin/empleo/applications/:id
// ============================================================
async function getById(req, res) {
  try {
    await ensureTable();

    const id = asInt(req.params.id, 0);
    if (!id) return res.status(400).json({ ok: false, message: "ID inválido." });

    const sql = `
      SELECT
        id,
        first_name AS firstName,
        last_name AS lastName,
        age,
        phone,
        email,
        areas,
        prequal,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM job_applications
      WHERE id = ?
      LIMIT 1
    `;

    const rows = await dbRows(sql, [id]);
    const row = rows?.[0];

    if (!row) return res.status(404).json({ ok: false, message: "No encontrado." });

    return res.json({
      ok: true,
      item: {
        ...row,
        areas: parseAreasField(row.areas),
      },
    });
  } catch (err) {
    console.error("jobApplications.getById error:", err);

    if (isNoSuchTable(err)) {
      return res.status(404).json({
        ok: false,
        message: "No hay registros porque la tabla job_applications no existe.",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Error obteniendo aplicación.",
      code: err?.code,
      errno: err?.errno,
      sqlMessage: err?.sqlMessage,
    });
  }
}

// ============================================================
// POST /api/admin/empleo/applications
// Admin only
// ============================================================
async function create(req, res) {
  try {
    // ✅ defensa extra
    if (!requireAdminInsideController(req, res)) return;

    await ensureTable();

    const firstName = toStr(req.body.firstName);
    const lastName = toStr(req.body.lastName);
    const age = asInt(req.body.age, 0);
    const phone = toStr(req.body.phone);
    const email = toStr(req.body.email).toLowerCase();
    const prequal = toStr(req.body.prequal).toUpperCase();
    const areas = normalizeAreas(req.body.areas);

    if (!firstName || firstName.length < 2) {
      return res.status(400).json({ ok: false, message: "Nombres inválidos." });
    }
    if (!lastName || lastName.length < 2) {
      return res.status(400).json({ ok: false, message: "Apellidos inválidos." });
    }
    if (!age || age < 14 || age > 99) {
      return res.status(400).json({ ok: false, message: "Edad inválida (14–99)." });
    }
    if (!phone || phone.length < 6) {
      return res.status(400).json({ ok: false, message: "Teléfono inválido." });
    }
    if (!email || !isEmailValid(email)) {
      return res.status(400).json({ ok: false, message: "Email inválido." });
    }
    if (!ALLOWED_PREQUAL.has(prequal)) {
      return res.status(400).json({ ok: false, message: "Pre-calificación inválida." });
    }
    if (!areas.length) {
      return res.status(400).json({ ok: false, message: "Seleccioná al menos 1 área." });
    }

    const sql = `
      INSERT INTO job_applications
      (first_name, last_name, age, phone, email, areas, prequal, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await dbExec(sql, [
      firstName,
      lastName,
      age,
      phone,
      email,
      JSON.stringify(areas),
      prequal,
    ]);

    return res.status(201).json({
      ok: true,
      message: "Aplicación creada.",
      id: result?.insertId ?? null,
    });
  } catch (err) {
    console.error("jobApplications.create error:", err);

    return res.status(500).json({
      ok: false,
      message: "Error creando aplicación.",
      code: err?.code,
      errno: err?.errno,
      sqlMessage: err?.sqlMessage,
    });
  }
}

// ============================================================
// PUT /api/admin/empleo/applications/:id
// Admin only
// ============================================================
async function update(req, res) {
  try {
    // ✅ defensa extra
    if (!requireAdminInsideController(req, res)) return;

    await ensureTable();

    const id = asInt(req.params.id, 0);
    if (!id) return res.status(400).json({ ok: false, message: "ID inválido." });

    const firstName = toStr(req.body.firstName);
    const lastName = toStr(req.body.lastName);
    const age = asInt(req.body.age, 0);
    const phone = toStr(req.body.phone);
    const email = toStr(req.body.email).toLowerCase();
    const prequal = toStr(req.body.prequal).toUpperCase();
    const areas = normalizeAreas(req.body.areas);

    if (!firstName || firstName.length < 2) {
      return res.status(400).json({ ok: false, message: "Nombres inválidos." });
    }
    if (!lastName || lastName.length < 2) {
      return res.status(400).json({ ok: false, message: "Apellidos inválidos." });
    }
    if (!age || age < 14 || age > 99) {
      return res.status(400).json({ ok: false, message: "Edad inválida (14–99)." });
    }
    if (!phone || phone.length < 6) {
      return res.status(400).json({ ok: false, message: "Teléfono inválido." });
    }
    if (!email || !isEmailValid(email)) {
      return res.status(400).json({ ok: false, message: "Email inválido." });
    }
    if (!ALLOWED_PREQUAL.has(prequal)) {
      return res.status(400).json({ ok: false, message: "Pre-calificación inválida." });
    }
    if (!areas.length) {
      return res.status(400).json({ ok: false, message: "Seleccioná al menos 1 área." });
    }

    const exists = await dbRows(
      `SELECT id FROM job_applications WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!exists?.[0]?.id) return res.status(404).json({ ok: false, message: "No encontrado." });

    const sql = `
      UPDATE job_applications
      SET
        first_name = ?,
        last_name = ?,
        age = ?,
        phone = ?,
        email = ?,
        areas = ?,
        prequal = ?,
        updated_at = NOW()
      WHERE id = ?
      LIMIT 1
    `;

    const result = await dbExec(sql, [
      firstName,
      lastName,
      age,
      phone,
      email,
      JSON.stringify(areas),
      prequal,
      id,
    ]);

    const affected = result?.affectedRows ?? 0;
    if (!affected) return res.status(404).json({ ok: false, message: "No encontrado." });

    return res.json({ ok: true, message: "Aplicación actualizada." });
  } catch (err) {
    console.error("jobApplications.update error:", err);

    return res.status(500).json({
      ok: false,
      message: "Error actualizando aplicación.",
      code: err?.code,
      errno: err?.errno,
      sqlMessage: err?.sqlMessage,
    });
  }
}

// ============================================================
// DELETE /api/admin/empleo/applications/:id
// Admin only
// ============================================================
async function remove(req, res) {
  try {
    // ✅ defensa extra
    if (!requireAdminInsideController(req, res)) return;

    await ensureTable();

    const id = asInt(req.params.id, 0);
    if (!id) return res.status(400).json({ ok: false, message: "ID inválido." });

    const result = await dbExec(`DELETE FROM job_applications WHERE id = ? LIMIT 1`, [id]);
    const affected = result?.affectedRows ?? 0;

    if (!affected) return res.status(404).json({ ok: false, message: "No encontrado." });

    return res.json({ ok: true, message: "Aplicación eliminada." });
  } catch (err) {
    console.error("jobApplications.remove error:", err);

    return res.status(500).json({
      ok: false,
      message: "Error eliminando aplicación.",
      code: err?.code,
      errno: err?.errno,
      sqlMessage: err?.sqlMessage,
    });
  }
}

// ============================================================
// GET /api/admin/empleo/applications/export.csv
// Visible para roles de vista (admin + otros permitidos)
// ============================================================
async function exportCsv(req, res) {
  try {
    await ensureTable();

    const q = toStr(req.query.query);
    const prequal = toStr(req.query.prequal).toUpperCase();
    const area = toStr(req.query.area);

    const where = [];
    const params = [];

    if (q) {
      where.push(`(
        LOWER(first_name) LIKE ?
        OR LOWER(last_name) LIKE ?
        OR LOWER(email) LIKE ?
        OR LOWER(phone) LIKE ?
      )`);
      const like = `%${q.toLowerCase()}%`;
      params.push(like, like, like, like);
    }

    if (prequal && ALLOWED_PREQUAL.has(prequal)) {
      where.push(`prequal = ?`);
      params.push(prequal);
    }

    if (area && ALLOWED_AREAS.has(area)) {
      where.push(`JSON_CONTAINS(areas, JSON_QUOTE(?))`);
      params.push(area);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        first_name AS firstName,
        last_name AS lastName,
        age,
        phone,
        email,
        areas,
        prequal,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM job_applications
      ${whereSql}
      ORDER BY created_at DESC
    `;

    const rows = await dbRows(sql, params);

    const header = [
      "Nombres",
      "Apellidos",
      "Edad",
      "Telefono",
      "Email",
      "Areas",
      "Precalificacion",
      "Creado",
      "Actualizado",
    ].join(";");

    const lines = (rows || []).map((r) => {
      const areasArr = parseAreasField(r.areas);
      const pretty = areasArr.map(prettyArea).join(", ");

      return [
        csvSafe(r.firstName),
        csvSafe(r.lastName),
        csvSafe(r.age),
        csvSafe(r.phone),
        csvSafe(r.email),
        csvSafe(pretty),
        csvSafe(r.prequal),
        csvSafe(r.createdAt),
        csvSafe(r.updatedAt),
      ].join(";");
    });

    const content = [header, ...lines].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="don-francisco_empleo_${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`
    );

    return res.send(content);
  } catch (err) {
    console.error("jobApplications.exportCsv error:", err);

    if (isNoSuchTable(err)) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="don-francisco_empleo_${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`
      );
      return res.send(
        "Nombres;Apellidos;Edad;Telefono;Email;Areas;Precalificacion;Creado;Actualizado\n"
      );
    }

    return res.status(500).json({
      ok: false,
      message: "Error exportando CSV.",
      code: err?.code,
      errno: err?.errno,
      sqlMessage: err?.sqlMessage,
    });
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  exportCsv,
};
