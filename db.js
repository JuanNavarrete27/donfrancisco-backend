/*
  db.js — MySQL pool ESTABLE (Clever Cloud friendly)
*/

const mysql = require("mysql2/promise");

// ⚠️ IMPORTANTE: usar SIEMPRE variables de entorno en producción
const pool = mysql.createPool({
  host: process.env.DB_HOST || "brhodt102rnderfadyew-mysql.services.clever-cloud.com",
  user: process.env.DB_USER || "uck60lcvdg2oj7xl",
  password: process.env.DB_PASSWORD || "ZLkXlB4PWtFAMwNdw25q",
  database: process.env.DB_NAME || "brhodt102rnderfadyew",
  port: 3306,

  // 🔒 CLAVES PARA CLEVER CLOUD (plan free)
  waitForConnections: true,
  connectionLimit: 3, // ⬅️ NO subir esto
  queueLimit: 0,

  // 🔒 evita reconexiones fantasmas
  enableKeepAlive: false
});

// ⚠️ NO TEST ACTIVO
// ⚠️ NO pool.getConnection() manual
// ⚠️ NO SELECT 1
// Clever Cloud maneja el lifecycle solo

module.exports = pool;
