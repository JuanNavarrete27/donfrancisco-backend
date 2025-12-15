/*
  db.js — MySQL pool ESTABLE (Clever Cloud friendly)
*/

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "brhodt102rnderfadyew-mysql.services.clever-cloud.com",
  user: "uck60lcvdg2oj7xl",
  password: "ZLkXlB4PWtFAMwNdw25q",
  database: "brhodt102rnderfadyew",
  port: 3306,

  // 🔒 CLAVE PARA NO PASARSE DE CONEXIONES
  waitForConnections: true,
  connectionLimit: 3,     // ⬅️ BAJAMOS A 3 (CLAVE)
  queueLimit: 0
});

// ❌ NO TEST ACTIVO
// ❌ NO SELECT 1
// ❌ NO keep alive SQL
// Clever Cloud cierra conexiones inactivas solo

module.exports = pool;
