/*
  db.js — conexión MySQL optimizada para Render + Clever Cloud + local
*/

require('dotenv').config();
const mysql = require('mysql2/promise');

// VARIABLES NECESARIAS
const REQUIRED = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
for (const v of REQUIRED) {
  if (!process.env[v]) console.warn(`⚠️ Falta variable: ${v}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 8,
  queueLimit: 0
});

// TEST DE CONEXIÓN
(async () => {
  try {
    const [r] = await pool.query("SELECT 1 AS ok");
    console.log("✅ DB conectada correctamente:", r[0].ok);
  } catch (err) {
    console.error("❌ Error conectando a la DB:", err.message);
  }
})();

module.exports = pool;
