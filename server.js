/*
  server.js — versión optimizada para Render + Angular + rutas de reservas
*/
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./db');

const reservasRouter = require('./routes/reservas');
const usuariosRouter = require('./routes/usuarios');
const tablasRouter = require('./routes/tablas');
const goleadoresRouter = require('./routes/goleadores');
const eventosRouter = require('./routes/eventos');

const app = express();

/* ============================================================
   CORS — CONFIG DON FRANCISCO FRONTEND
   ============================================================ */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
);
app.options('*', cors());

/* ============================================================
   BODY PARSER
   ============================================================ */
app.use(express.json({ limit: '10mb' }));

/* ============================================================
   ARCHIVOS ESTÁTICOS — AVATARS
   ============================================================ */
app.use('/avatars', express.static(path.join(__dirname, 'avatars')));

/* ============================================================
   RUTAS API
   ============================================================ */
app.use('/reservas', reservasRouter);
app.use('/usuarios', usuariosRouter);
app.use('/tablas', tablasRouter);
app.use('/goleadores', goleadoresRouter);
app.use('/eventos', eventosRouter);

/* ============================================================
   ROOT
   ============================================================ */
app.get('/', (req, res) => {
  res.send('Don Francisco backend funcionando correctamente');
});

/* ============================================================
   SERVER RUN
   ============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});

/* ============================================================
   KEEP ALIVE DB — NECESARIO EN RENDER
   ============================================================ */
setInterval(() => {
  db.query('SELECT 1')
    .then(() => console.log('Ping DB ✓'))
    .catch(err => console.error('Ping DB fallido:', err));
}, 5 * 60 * 1000);
