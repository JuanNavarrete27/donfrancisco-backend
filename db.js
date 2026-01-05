/*
  db.js — Configuración de pool MySQL robusta
  - Usa variables de entorno (sin credenciales hardcodeadas)
  - Soporta SSL opcional
  - Expone helpers query, ping, shutdown
*/

const fs = require("fs");
const mysql = require("mysql2/promise");

const env = process.env;

const parseBool = (v) => v === "1" || v === "true";
const numberFromEnv = (key, def) => {
  const v = Number(env[key]);
  return Number.isFinite(v) ? v : def;
};

const host = env.DB_HOST || env.MYSQL_HOST || env.DB_HOST_ALT;
const port = numberFromEnv("DB_PORT", numberFromEnv("MYSQL_PORT", 3306));
const user = env.DB_USER || env.MYSQL_USER;
const password = env.DB_PASSWORD || env.MYSQL_PASSWORD;
const database = env.DB_NAME || env.MYSQL_DATABASE || env.MYSQL_DB;
const connectionLimit = numberFromEnv("DB_CONN_LIMIT", 3);
const connectTimeout = numberFromEnv("DB_CONNECT_TIMEOUT_MS", 10000);
const acquireTimeout = numberFromEnv("DB_ACQUIRE_TIMEOUT_MS", 10000);
const enableSSL = parseBool(env.DB_SSL) || parseBool(env.MYSQL_SSL);
const rejectUnauthorized =
  env.DB_SSL_REJECT_UNAUTHORIZED === "0" || env.MYSQL_SSL_REJECT_UNAUTHORIZED === "0"
    ? false
    : true;

const missing = [];
if (!host) missing.push("DB_HOST");
if (!user) missing.push("DB_USER");
if (!password) missing.push("DB_PASSWORD");
if (!database) missing.push("DB_NAME");

if (missing.length > 0) {
  throw new Error(
    `[db] Faltan variables requeridas: ${missing.join(
      ", "
    )}. Configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME`
  );
}

let ssl = undefined;
if (enableSSL) {
  ssl = { rejectUnauthorized };
  if (env.DB_SSL_CA) {
    try {
      ssl.ca = fs.readFileSync(env.DB_SSL_CA, "utf8");
    } catch (e) {
      console.warn("[db] No se pudo leer DB_SSL_CA:", e.message);
    }
  }
}

const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,
  connectTimeout,
  acquireTimeout,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl,
});

console.log(
  `[db] Pool creado -> host:${host} port:${port} db:${database} user:${user} ssl:${Boolean(
    ssl
  )} connLimit:${connectionLimit} connectTimeout:${connectTimeout} acquireTimeout:${acquireTimeout}`
);

const query = (sql, params) => pool.query(sql, params);

const ping = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
};

const shutdown = async () => {
  await pool.end();
  console.log("[db] Pool cerrado");
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = {
  query,
  ping,
  shutdown,
};
