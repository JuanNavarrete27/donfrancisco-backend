/*
  db.js — MySQL pool ULTRA ESTABLE (Clever Cloud FREE)
  ⚠️ NO TOCAR connectionLimit / keepAlive
*/

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "brhodt102rnderfadyew-mysql.services.clever-cloud.com",
  user: "uck60lcvdg2oj7xl",
  password: "ZLkXlB4PWtFAMwNdw25q",
  database: "brhodt102rnderfadyew",
  port: 3306,

  // 🔒 CRÍTICO PARA CLEVER CLOUD FREE
  waitForConnections: true,
  connectionLimit: 2,      // ⬅️ NO subir
  queueLimit: 0,

  // 🔒 evita cortes fantasma
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// ❌ NO usar pool.getConnection()
// ❌ NO hacer SELECT 1
// ❌ NO crear más de un pool
// ✔ usar SIEMPRE pool.query()

module.exports = pool;
