const db = require('../db'); // tu conexión MySQL
const nodemailer = require('nodemailer');

exports.crearReserva = async (req, res) => {
  try {
    const { nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje } = req.body;

    const sql = `
      INSERT INTO reservas 
      (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [nombre, telefono, email || null, fecha, hora, cancha || 'Cancha principal', duracion || 1, tipo || 'F7', mensaje || ''];

    db.query(sql, values, async (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Ya hay una reserva para esa fecha, hora y cancha' });
        }
        console.error(err);
        return res.status(500).json({ error: 'Error al crear la reserva' });
      }

      // Enviar email si se proporcionó
      if (email) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Reserva confirmada - Bentasca',
          html: `
            <h2>¡Tu reserva fue confirmada!</h2>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${hora}</p>
            <p><strong>Cancha:</strong> ${cancha || 'Cancha principal'}</p>
            <p>Ubicación: <a href="https://maps.app.goo.gl/gx3WY1hgbot16C8f8">Ver en Google Maps</a></p>
            <p>Gracias por reservar en Bentasca ⚽</p>
          `
        });
      }

      res.json({ ok: true, reservaId: result.insertId });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
};
