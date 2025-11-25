// reservasController.js
const db = require('../db');
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY?.trim(),
});

const TEMPLATE_ID = "0r83ql3yx7pgzw1j";

exports.crearReserva = async (req, res) => {
  try {
    const { nombre, telefono, email, fecha, hora, cancha, duracion = 1, tipo = 'F7', mensaje = '' } = req.body;

    // INTENTAMOS GUARDAR LA RESERVA
    const sql = `INSERT INTO reservas (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      nombre?.trim(),
      telefono?.trim(),
      email?.trim() || null,
      fecha,
      hora,
      cancha?.trim() || 'Cancha principal',
      duracion,
      tipo,
      mensaje?.trim() || ''
    ];

    let result;
    try {
      [result] = await db.query(sql, values);
    } catch (dbError) {
      // RESERVA DUPLICADA → devolvemos 409 claro y bonito
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          error: 'Horario no disponible',
          mensaje: 'Ya existe una reserva para esa fecha, hora y cancha. Elegí otro horario por favor.'
        });
      }
      throw dbError; // otro error raro de DB
    }

    const reservaId = result.insertId;

    // DATOS PARA EL TEMPLATE
    const data = {
      nombre: nombre?.trim() || 'Cliente',
      fecha, hora,
      cancha: cancha?.trim() || 'Cancha principal',
      duracion,
      personas: duracion,
      telefono: telefono?.trim() || '',
      email: email?.trim() || '',
      mensaje: mensaje?.trim() || 'Sin mensaje adicional',
    };

    // ENVÍO DE EMAILS (no rompe nada si falla)
    try {
      const from = new Sender(process.env.MAILERSEND_FROM, "Bentasca");

      if (email && email.includes('@')) {
        await mailer.email.send(new EmailParams()
          .setFrom(from)
          .setTo([new Recipient(email.trim(), nombre)])
          .setReplyTo(process.env.MAILERSEND_ADMIN)
          .setSubject("¡Tu reserva en Bentasca está confirmada!")
          .setTemplateId(TEMPLATE_ID)
          .setPersonalization([{ email: email.trim(), data }]));
      }

      if (process.env.MAILERSEND_ADMIN?.includes('@')) {
        await mailer.email.send(new EmailParams()
          .setFrom(from)
          .setTo([new Recipient(process.env.MAILERSEND_ADMIN.trim(), "Admin")])
          .setSubject(`Nueva reserva - ${nombre} - ${fecha} ${hora}`)
          .setTemplateId(TEMPLATE_ID)
          .setPersonalization([{ email: process.env.MAILERSEND_ADMIN.trim(), data }]));
      }
    } catch (emailError) {
      console.error("Emails fallaron (pero reserva OK):", emailError.message);
      // No hacemos nada más → la reserva ya está guardada
    }

    // RESPUESTA EXITOSA
    return res.json({
      ok: true,
      reservaId,
      mensaje: "Reserva creada con éxito"
    });

  } catch (error) {
    console.error("Error crítico:", error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
