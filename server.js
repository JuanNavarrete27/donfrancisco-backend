/*
  server.js — versión optimizada Don Francisco (usuarios + reservas)
*/

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./db");
const reservasRouter = require("./routes/reservas");
const usuariosRouter = require("./routes/usuarios");

const app = express();

/* ============================================================
   CORS CONFIG
============================================================ */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

/* ============================================================
   BODY PARSER
============================================================ */
app.use(express.json({ limit: "10mb" }));

/* ============================================================
   STATIC FILES (AVATARS)
============================================================ */
app.use("/avatars", express.static(path.join(__dirname, "avatars")));

/* ============================================================
   RUTAS ACTIVAS (solo usuarios + reservas)
============================================================ */
app.use("/reservas", reservasRouter);
app.use("/usuarios", usuariosRouter);

/* ============================================================
   ROOT
============================================================ */
app.get("/", (req, res) => {
  res.send("Backend Don Francisco funcionando correctamente.");
});

/* ============================================================
   SERVER
============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
);

/* ============================================================
   KEEP ALIVE PARA RENDER
============================================================ */
setInterval(() => {
  db.query("SELECT 1").catch(() => {});
}, 5 * 60 * 1000);
