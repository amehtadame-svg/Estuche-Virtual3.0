import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationCode(email: string, token: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Estuche Virtual" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Tu código de verificación',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2>Código de verificación</h2>
          <p>Usa este código para continuar. Es válido por 15 minutos:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${token}</p>
          <p style="color: #666; font-size: 0.85rem;">
            Si tú no solicitaste este código, puedes ignorar este correo.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
}