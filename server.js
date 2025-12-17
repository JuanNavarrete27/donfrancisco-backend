/*
  server.js — versión mínima, estable y funcional Don Francisco
  Usuarios + Noticias + Contacto
*/

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ⚠️ seguimos importando db para que el pool exista,
// pero NO hacemos queries acá
require("./db");

// ROUTES
const usuariosRouter = require("./routes/usuarios");
const noticiasRouter = require("./routes/noticias");
const contactoRouter = require("./routes/contacto");

const app = express();

/* ============================================================
   CORS CONFIG ✅ FIX NETLIFY
============================================================ */
const allowedOrigins = [
  "https://donfrancisco.netlify.app",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4200",
  "https://donfrancisco.uy"
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ✅ RESPONDER PREFLIGHT
app.options("*", cors());

/* ============================================================
   BODY PARSER
============================================================ */
app.use(express.json({ limit: "10mb" }));

/* ============================================================
   STATIC FILES
============================================================ */
app.use("/avatars", express.static(path.join(__dirname, "avatars")));

/* ============================================================
   RUTAS ACTIVAS
============================================================ */
app.use("/usuarios", usuariosRouter);
app.use("/noticias", noticiasRouter);
app.use("/contacto", contactoRouter);

/* ============================================================
   ROOT
============================================================ */
app.get("/", (req, res) => {
  res.send("Backend Don Francisco funcionando correctamente ✔️");
});

/* ============================================================
   SERVER
============================================================ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
