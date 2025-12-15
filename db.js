/*
  db.js — conexión MySQL optimizada y estable
  Render + Clever Cloud + producción segura
*/

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "brhodt102rnderfadyew-mysql.services.clever-cloud.com",
  user: "uck60lcvdg2oj7xl",
  password: "ZLkXlB4PWtFAMwNdw25q",
  database: "brhodt102rnderfadyew",
  port: 3306,

  // 🔒 CLAVE PARA EVITAR EL ERROR DE CONEXIONES
  waitForConnections: true,
  connectionLimit: 4,   // ⬅️ MENOR que el máximo real (5)
  queueLimit: 10,       // cola pequeña, evita explosiones
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

/* ============================================================
   TEST DE CONEXIÓN (una sola vez)
============================================================ */
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    console.log("✅ DB conectada correctamente (pool activo)");
  } catch (err) {
    console.error("❌ Error conectando a la DB:", err.message);
  }
})();

module.exports = pool;
