/*
  server.js — versión estable y lista para producción (Starlight/Hyperlift)
  Usuarios + Noticias + Contacto + Salón
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

// ✅ SALÓN
const salonRouter = require("./routes/salon");
const adminSalonRouter = require("./routes/adminSalon");

const app = express();

// ✅ importante detrás de proxy (Cloudflare / Nginx / Render)
app.set("trust proxy", 1);

/* ============================================================
   HELPERS
============================================================ */
function normalizeOrigin(o) {
  if (!o) return "";
  return String(o).replace(/\/$/, ""); // saca slash final
}

// Permite exactamente dominios definidos y también subdominios de donfrancisco.uy si querés.
function isAllowedOrigin(origin, allowed) {
  const o = normalizeOrigin(origin);

  if (allowed.includes(o)) return true;

  // ✅ opcional: permitir subdominios tipo https://www.donfrancisco.uy
  if (o.endsWith(".donfrancisco.uy")) return true;

  return false;
}

/* ============================================================
   CORS CONFIG ✅ NETLIFY + CLOUDFLARE
============================================================ */
const allowedOrigins = [
  "https://donfrancisco.netlify.app",
  "https://donfrancisco.uy",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4200",
  "https://api.donfrancisco.uy"
]
  .filter(Boolean)
  .map(normalizeOrigin);

app.use(
  cors({
    origin: function (origin, callback) {
      // requests server-to-server / curl / health checks
      if (!origin) return callback(null, true);

      if (isAllowedOrigin(origin, allowedOrigins)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// ✅ responder preflight sin duplicar config rara
app.options("*", (req, res) => res.sendStatus(204));

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
app.use("/salon", salonRouter);
app.use("/admin/salon", adminSalonRouter);

/* ============================================================
   HEALTHCHECK (útil en Starlight)
============================================================ */
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, service: "donfrancisco-backend", ts: Date.now() });
});

/* ============================================================
   ROOT
============================================================ */
app.get("/", (req, res) => {
  res.send("Backend Don Francisco funcionando correctamente ✔️");
});

/* ============================================================
   ERROR HANDLER (incluye CORS)
============================================================ */
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ ok: false, error: "CORS_BLOCKED" });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: "SERVER_ERROR" });
});

/* ============================================================
   SERVER
============================================================ */
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
