import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

// Verificar variables de entorno requeridas
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Faltan variables de entorno requeridas para el servicio de correo:', missingEnvVars);
  process.exit(1);
}

// Crear el transporter con configuración mejorada
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Permite certificados autofirmados
  }
});

// Verificar la conexión al iniciar
transporter.verify(function(error: any, success: any) {
  if (error) {
    console.error('❌ Error en la configuración del servicio de correo:', error);
  }
});

// Función auxiliar para enviar correos con mejor manejo de errores
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      ...options
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw error;
  }
}; 