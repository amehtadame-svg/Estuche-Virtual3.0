import nodemailer, { Transporter } from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * MAILER
 * ------
 * Envía los correos reales del sistema (código de recuperación de contraseña).
 *
 * Configuración por variables de entorno en `be/.env`:
 *
 *   EMAIL_USER=estuchevirtual272@gmail.com
 *   EMAIL_PASS=xxxxxxxxxxxxxxxx     <-- Contraseña de aplicación de Google (16 caracteres)
 *
 * IMPORTANTE sobre Gmail:
 *   - NO sirve la contraseña normal de la cuenta. Google la rechaza desde 2022.
 *   - Hay que activar la Verificación en 2 pasos y generar una
 *     "Contraseña de aplicación" en https://myaccount.google.com/apppasswords
 *   - Google la muestra como "abcd efgh ijkl mnop". Los espacios se ignoran
 *     automáticamente aquí abajo, así que puedes pegarla tal cual.
 *
 * Si no hay credenciales configuradas y NODE_ENV !== 'production', se usa una
 * cuenta de prueba de Ethereal: el correo NO llega a la bandeja real, pero se
 * imprime en consola una URL para verlo. Así el flujo nunca queda "roto en
 * silencio" mientras se consigue la contraseña de aplicación.
 */

const EMAIL_USER = process.env.EMAIL_USER?.trim();
// Google muestra la app password con espacios; hay que quitarlos.
const EMAIL_PASS = process.env.EMAIL_PASS?.replace(/\s+/g, '');
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME?.trim() || 'Estuche Virtual';
const IS_PROD = process.env.NODE_ENV === 'production';

export const mailerIsConfigured = Boolean(EMAIL_USER && EMAIL_PASS);

let transporterPromise: Promise<Transporter> | null = null;
let usingEthereal = false;

function buildGmailTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: String(process.env.SMTP_SECURE ?? 'true') === 'true', // 465 = SSL directo
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

async function buildEtherealTransporter(): Promise<Transporter> {
  const testAccount = await nodemailer.createTestAccount();
  usingEthereal = true;
  console.warn(
    '\n[mailer] ⚠️  EMAIL_USER/EMAIL_PASS no están configurados en be/.env.\n' +
      '[mailer]     Usando una cuenta de prueba (Ethereal): el correo NO llegará a\n' +
      '[mailer]     una bandeja real, pero verás un enlace para leerlo en consola.\n' +
      '[mailer]     Para que llegue de verdad, genera una contraseña de aplicación en\n' +
      '[mailer]     https://myaccount.google.com/apppasswords y ponla en EMAIL_PASS.\n'
  );
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (mailerIsConfigured) return buildGmailTransporter();
      if (IS_PROD) {
        throw new Error(
          'EMAIL_USER y EMAIL_PASS son obligatorios en producción para poder enviar correos.'
        );
      }
      return buildEtherealTransporter();
    })();
  }
  return transporterPromise;
}

/** Traduce los errores crípticos de SMTP a algo accionable en consola. */
function explainSmtpError(err: unknown): string {
  const e = err as { code?: string; responseCode?: number; message?: string };
  const msg = e?.message ?? String(err);

  if (e?.responseCode === 535 || /Username and Password not accepted|BadCredentials/i.test(msg)) {
    return (
      'Gmail rechazó las credenciales (535). Causas típicas:\n' +
      '  1) EMAIL_PASS está vacío o tiene la contraseña normal de la cuenta.\n' +
      '     -> Necesitas una CONTRASEÑA DE APLICACIÓN de 16 caracteres.\n' +
      '  2) La cuenta no tiene activada la Verificación en 2 pasos.\n' +
      '     -> Actívala primero: https://myaccount.google.com/signinoptions/two-step-verification\n' +
      '  3) Generaste la app password para otra cuenta distinta a EMAIL_USER.'
    );
  }
  if (e?.code === 'EAUTH') {
    return 'Fallo de autenticación SMTP. Revisa EMAIL_USER y EMAIL_PASS en be/.env.';
  }
  if (e?.code === 'ETIMEDOUT' || e?.code === 'ECONNECTION' || e?.code === 'ESOCKET') {
    return (
      'No se pudo conectar al servidor SMTP. Revisa tu conexión o si la red/firewall\n' +
      '  bloquea el puerto 465. Puedes probar con SMTP_PORT=587 y SMTP_SECURE=false.'
    );
  }
  return msg;
}

export async function verifyMailer(): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    if (usingEthereal) {
      console.log('[mailer] ✅ Listo (modo prueba Ethereal).');
    } else {
      console.log(`[mailer] ✅ Conectado a SMTP como ${EMAIL_USER}. Los correos se enviarán de verdad.`);
    }
    return true;
  } catch (err) {
    console.error('[mailer] ❌ No se pudo conectar al servidor de correo:\n  ' + explainSmtpError(err));
    return false;
  }
}

export interface SendResult {
  sent: boolean;
  previewUrl?: string;
  error?: string;
}

export async function sendVerificationCode(
  email: string,
  code: string,
  expiresInMinutes = 15
): Promise<SendResult> {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER ?? 'no-reply@estuchevirtual.com'}>`,
      to: email,
      subject: `${code} es tu código de recuperación · Estuche Virtual`,
      text:
        `Tu código de recuperación es: ${code}\n\n` +
        `Es válido por ${expiresInMinutes} minutos y solo se puede usar una vez.\n` +
        `Si tú no solicitaste este código, ignora este correo.`,
      html: `
        <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f5f6fa;padding:32px 16px;">
          <div style="max-width:480px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
            <div style="background:linear-gradient(135deg,#aa3bff,#6d28d9);padding:24px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:1.25rem;letter-spacing:.5px;">Estuche Virtual</h1>
            </div>
            <div style="padding:28px 32px;">
              <h2 style="margin:0 0 8px;font-size:1.1rem;color:#1f2937;">Recuperación de contraseña</h2>
              <p style="margin:0 0 20px;color:#4b5563;font-size:.95rem;line-height:1.5;">
                Usa el siguiente código para continuar. Es válido por
                <strong>${expiresInMinutes} minutos</strong> y solo se puede usar una vez.
              </p>
              <div style="text-align:center;margin:24px 0;">
                <span style="display:inline-block;background:#f3e8ff;color:#6d28d9;font-size:34px;font-weight:700;letter-spacing:10px;padding:14px 22px;border-radius:10px;border:1px dashed #c084fc;">
                  ${code}
                </span>
              </div>
              <p style="margin:0;color:#9ca3af;font-size:.8rem;line-height:1.5;">
                Si tú no solicitaste este código, puedes ignorar este correo.
                Tu contraseña seguirá siendo la misma.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    const previewUrl = usingEthereal
      ? (nodemailer.getTestMessageUrl(info) as string | false) || undefined
      : undefined;

    if (previewUrl) {
      console.log(`[mailer] 📬 Correo de prueba para ${email}. Míralo aquí: ${previewUrl}`);
    } else {
      console.log(`[mailer] 📤 Código enviado a ${email} (messageId: ${info.messageId})`);
    }

    return { sent: true, previewUrl: previewUrl || undefined };
  } catch (err) {
    const detail = explainSmtpError(err);
    console.error(`[mailer] ❌ Falló el envío a ${email}:\n  ${detail}`);
    return { sent: false, error: detail };
  }
}