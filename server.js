
/*
  server.js - entrypoint
*/
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

app.use(express.json());
app.use(cors()); // en producción restringir origin a tu dominio

// routes
const usuariosRoutes = require('./routes/usuarios');
const tablasRoutes = require('./routes/tablas');
const goleadoresRoutes = require('./routes/goleadores');
const eventosRoutes = require('./routes/eventos');

app.use('/usuarios', usuariosRoutes);
app.use('/tablas', tablasRoutes);
app.use('/goleadores', goleadoresRoutes);
app.use('/eventos', eventosRoutes);

app.get('/', (req, res) => res.send('Bentasca backend (bcryptjs)'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
