/*
  db.js — MySQL pool ULTRA ESTABLE (Clever Cloud FREE)
*/

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "brhodt102rnderfadyew-mysql.services.clever-cloud.com",
  user: process.env.DB_USER || "uck60lcvdg2oj7xl",
  password: process.env.DB_PASSWORD || "ZLkXlB4PWtFAMwNdw25q",
  database: process.env.DB_NAME || "brhodt102rnderfadyew",
  port: 3306,

  // 🔒 CRÍTICO para Clever Cloud free
  waitForConnections: true,
  connectionLimit: 2,      // ⬅️ BAJAR SÍ O SÍ
  queueLimit: 0,

  // 🔒 evita reconexiones fantasma
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// ❌ NO hacer pool.getConnection()
// ❌ NO hacer SELECT 1
// ❌ NO crear más de un pool
// ✔ usar SIEMPRE pool.query()

module.exports = pool;
