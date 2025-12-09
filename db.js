/*
  db.js - mysql2/promise pool connection (CORREGIDO)
*/
require('dotenv').config();
const mysql = require('mysql2/promise'); // 👈 ESTA ES LA CORRECCIÓN CLAVE

const {
  MYSQL_ADDON_HOST,
  MYSQL_ADDON_USER,
  MYSQL_ADDON_PASSWORD,
  MYSQL_ADDON_DB,
  MYSQL_ADDON_PORT,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT
} = process.env;

const pool = mysql.createPool({
  host: MYSQL_ADDON_HOST || DB_HOST || 'b99rg5klb9i5qhzdwcy4-mysql.services.clever-cloud.com',
  user: MYSQL_ADDON_USER || DB_USER || 'uanhygqsgszwryv8',
  password: MYSQL_ADDON_PASSWORD || DB_PASSWORD || 'vpP9Puizq27MwNCL7PrZ',
  database: MYSQL_ADDON_DB || DB_NAME || 'b99rg5klb9i5qhzdwcy4',
  port: Number(MYSQL_ADDON_PORT || DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 4,
  queueLimit: 0
});

// Exportar pool directamente (ya es basado en promesas)
module.exports = pool;
