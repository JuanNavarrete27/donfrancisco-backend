// utils/mailer.js — 100% funcional sin upgrade ni sender verificado
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY?.trim(),
});

// USAMOS EL SENDER DE PRUEBA DE MAILERSEND (NO REQUIERE UPGRADE)
const sender = new Sender("MS_0r83ql3y@trial-mailersend.net", "Bentasca");

/**
 * Enviar correo de reserva (cliente + admin)
 * @param {object} reserva
 */
async function enviarMailReserva(reserva) {
  try {
    const fechaBonita = new Date(reserva.fecha).toLocaleDateString('es-UY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0f0f0f; color: white; border: 4px solid #20c35a; border-radius: 20px; text-align: center;">
        <h1 style="color: #20c35a; margin-bottom: 20px;">RESERVA CONFIRMADA</h1>
        <h2>¡Hola ${reserva.nombre}!</h2>
        <div style="background: rgba(32,195,90,0.2); padding: 25px; border-radius: 16px; margin: 25px 0;">
          <p style="margin: 10px 0; font-size: 22px;"><strong>Fecha:</strong> ${fechaBonita}</p>
          <p style="margin: 10px 0; font-size: 28px; color: #20c35a;"><strong>Hora:</strong> ${reserva.hora}h</p>
          <p style="margin: 10px 0;"><strong>Cancha:</strong> ${reserva.cancha || 'Principal'}</p>
          <p style="margin: 10px 0;"><strong>Duración:</strong> ${reserva.duracion}h</p>
        </div>
        <p style="font-size: 18px;">¡Nos vemos en la cancha!</p>
        <p style="margin-top: 30px; color: #888; font-size: 14px;">
          <a href="https://maps.app.goo.gl/gx3WY1hgbot16C8f8" style="color: #20c35a;">Ver ubicación en Google Maps</a>
        </p>
        <hr style="border: 1px solid #333; margin: 30px 0;">
        <p style="color: #20c35a; font-size: 20px;">Bentasca ⚽</p>
      </div>
    `;

    // MAIL AL CLIENTE
    if (reserva.email && reserva.email.includes('@')) {
      const clienteParams = new EmailParams()
        .setFrom(sender)
        .setTo([new Recipient(reserva.email.trim(), reserva.nombre)])
        .setSubject(`¡Reserva confirmada! - ${fechaBonita} ${reserva.hora}h`)
        .setHtml(html);

      await mailer.email.send(clienteParams);
      console.log("Mail enviado al cliente:", reserva.email);
    }

    // MAIL AL ADMIN (siempre, aunque el cliente no tenga mail)
    if (process.env.MAILERSEND_ADMIN?.includes('@')) {
      const adminHtml = html.replace('¡Hola ' + reserva.nombre + '!', 'Nueva reserva recibida');
      const adminParams = new EmailParams()
        .setFrom(sender)
        .setTo([new Recipient(process.env.MAILERSEND_ADMIN.trim(), "Admin")])
        .setSubject(`NUEVA RESERVA - ${reserva.nombre} - ${fechaBonita} ${reserva.hora}h`)
        .setHtml(adminHtml);

      await mailer.email.send(adminParams);
      console.log("Mail enviado al admin:", process.env.MAILERSEND_ADMIN);
    }

  } catch (error) {
    console.error("Error enviando mails (pero la reserva SÍ se guardó):", error.message);
    // No rompemos nada si falla el mail
  }
}

module.exports = enviarMailReserva;
