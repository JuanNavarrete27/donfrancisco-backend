const db = require('../db');
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const TEMPLATE_ID = "0r83ql3yx7pgzw1j"; // Tu template verificado

exports.crearReserva = async (req, res) => {
  try {
    const { nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje } = req.body;

    const sql = `
      INSERT INTO reservas
      (nombre, telefono, email, fecha, hora, cancha, duracion, tipo, mensaje)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nombre,
      telefono,
      email || null,
      fecha,
      hora,
      cancha || 'Cancha principal',
      duracion || 1,
      tipo || 'F7',
      mensaje || ''
    ];

    let insertResult;
    try {
      const [result] = await db.query(sql, values);
      insertResult = result;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          error: 'Ya hay una reserva para esa fecha, hora y cancha'
        });
      }
      throw err;
    }

    // Datos que van a reemplazar las variables {{ }} del template
    const personalizationData = {
      nombre,
      fecha,
      hora,
      cancha: cancha || 'Cancha principal',
      duracion: duracion || 1,
      personas: duracion, // si en el futuro cambias el nombre de variable
      telefono,
      email: email || '',
      mensaje: mensaje || 'Sin mensaje',
    };

    // Envío al cliente (solo si puso email)
    if (email) {
      const emailParamsCliente = new EmailParams()
        .setFrom(new Sender(process.env.MAILERSEND_FROM, "Bentasca"))
        .setTo([new Recipient(email, nombre)])
        .setReplyTo(process.env.MAILERSEND_ADMIN) // para que responda al restaurante
        .setSubject("¡Tu reserva en Bentasca está confirmada!")
        .setTemplateId(TEMPLATE_ID)
        .setPersonalization([
          {
            email: email,
            data: personalizationData
          }
        ]);

      await mailer.email.send(emailParamsCliente);
    }

    // Envío al administrador (siempre)
    const emailParamsAdmin = new EmailParams()
      .setFrom(new Sender(process.env.MAILERSEND_FROM, "Bentasca"))
      .setTo([new Recipient(process.env.MAILERSEND_ADMIN, "Admin Bentasca")])
      .setSubject(`Nueva reserva - ${nombre} - ${fecha} ${hora}`)
      .setTemplateId(TEMPLATE_ID)
      .setPersonalization([
        {
          email: process.env.MAILERSEND_ADMIN,
          data: personalizationData
        }
      ]);

    await mailer.email.send(emailParamsAdmin);

    res.json({
      ok: true,
      reservaId: insertResult.insertId
    });

  } catch (error) {
    console.error("Error en crearReserva:", error);
    res.status(500).json({ error: 'Error interno al crear la reserva' });
  }
};
