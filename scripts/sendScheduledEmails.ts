import 'dotenv/config';
console.log('INICIO SCRIPT sendScheduledEmails.ts');
import dbConnect from '../lib/dbConnect';
import ScheduledEmail, { IScheduledEmail } from '../lib/models/ScheduledEmail';
import sendEmail from '../lib/sendEmail'; // Debes tener esta función implementada
import { getEmailTemplate } from '../lib/email/templates';
import mongoose from 'mongoose';
import EmailTemplate from '@/lib/models/EmailTemplate'

function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

async function sendPendingEmails() {
  try {
    logWithTimestamp('Conectando a la base de datos...');
    await dbConnect();
    const now = new Date();
    logWithTimestamp('Script ejecutado. Fecha actual (UTC):', now.toISOString());

    // LOG DE TODOS LOS CORREOS
    const allEmails = await ScheduledEmail.find({});
    logWithTimestamp('TODOS LOS CORREOS EN BD:', allEmails.length);
    allEmails.forEach(email => {
      logWithTimestamp('Detalles del correo:', {
        id: email._id,
        sent: email.sent,
        scheduledDate: email.scheduledDate,
        recipients: email.recipients,
        subject: email.subject
      });
    });

    const emails: IScheduledEmail[] = await ScheduledEmail.find({
      sent: false,
      scheduledDate: { $lte: now }
    });

    logWithTimestamp('Correos pendientes para enviar:', emails.length);

    for (const email of emails) {
      try {
        logWithTimestamp('Procesando correo:', {
          id: email._id,
          recipients: email.recipients,
          subject: email.subject,
          scheduledDate: email.scheduledDate
        });

        // Usar el primer destinatario como nombre visual
        const name = email.recipients[0] || "User";
        const html = getEmailTemplate({ name, body: email.body });
        await sendEmail(email.recipients, email.subject, email.body, html);
        await email.deleteOne();
        logWithTimestamp(`✅ Correo enviado y eliminado de la base de datos:`, {
          recipients: email.recipients.join(', '),
          subject: email.subject
        });
      } catch (err) {
        logWithTimestamp('❌ Error enviando correo programado:', {
          error: err,
          emailId: email._id,
          recipients: email.recipients
        });
      }
    }

    logWithTimestamp('Script finalizado');
  } catch (error) {
    logWithTimestamp('❌ Error general en el script:', error);
  } finally {
    process.exit();
  }
}

sendPendingEmails(); 