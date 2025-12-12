/*
  db.js — conexión MySQL optimizada
  Render + Clever Cloud + local
*/

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "brhodt102rnderfadyew-mysql.services.clever-cloud.com",
  user: "uck60lcvdg2oj7xl",
  password: "ZLkXlB4PWtFAMwNdw25q",
  database: "brhodt102rnderfadyew",
  port: 3306,

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
