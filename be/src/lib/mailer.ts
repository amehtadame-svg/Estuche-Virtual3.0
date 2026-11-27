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

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

/** Aviso individual al equipo; la descripción se consulta en el panel. */
export async function sendNewPqrNotification(
  recipient: string,
  pqrId: string,
  type: 'petition' | 'complaint' | 'claim',
  pqrSubject?: string,
  createdAt?: Date,
): Promise<SendResult> {
  // No usar Ethereal como si fuera correo real para notificaciones administrativas.
  if (!mailerIsConfigured) return { sent: false, error: 'Correo SMTP no configurado.' };
  const labels = { petition: 'Petición', complaint: 'Queja', claim: 'Reclamo' };
  // Compatibilidad durante el cambio gradual de los dos archivos del servidor.
  const cleanSubject = (pqrSubject ?? '').replace(/[\r\n\t]+/g, ' ').trim() || 'Consulta el asunto en el panel';
  const dateLabel = createdAt && Number.isFinite(createdAt.getTime())
    ? `${new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(createdAt)} · hora de Colombia`
    : 'Consulta la fecha en el panel';
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to: recipient,
      subject: 'Nuevo PQR recibido · Estuche Virtual',
      text:
        `ESTUCHE VIRTUAL | Atención al cliente\n\n` +
        `Nuevo PQR recibido\n` +
        `Tipo: ${labels[type]}\n` +
        `Asunto: ${cleanSubject}\n` +
        `Fecha: ${dateLabel}\n` +
        `Referencia: ${pqrId}\n\n` +
        `Inicia sesión en Estuche Virtual y entra a PQR para consultar el mensaje completo y responder.`,
      html: `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0a10;font-family:Arial,Helvetica,sans-serif;color:#f8f4ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0c0a10;"><tr><td align="center" style="padding:36px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#15111c;border:1px solid #4a3159;border-radius:18px;">
      <tr><td style="padding:30px 30px 0;">
        <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#cf87ff;">ESTUCHE VIRTUAL</div>
        <div style="margin-top:8px;color:#b7aabd;font-size:13px;">ATENCIÓN AL CLIENTE</div>
      </td></tr>
      <tr><td style="padding:24px 30px 6px;">
        <span style="display:inline-block;border:1px solid #8445a1;border-radius:999px;background:#30143e;color:#e9c8ff;padding:6px 12px;font-size:12px;font-weight:bold;">${labels[type]}</span>
        <h1 style="margin:18px 0 10px;color:#ffffff;font-size:24px;line-height:1.25;">Nuevo PQR recibido</h1>
        <p style="margin:0;color:#c5b9ce;font-size:15px;line-height:1.6;">Un cliente ha enviado una solicitud. Ya está disponible en el panel de administración.</p>
      </td></tr>
      <tr><td style="padding:22px 30px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#211729;border:1px solid #4d345d;border-radius:12px;"><tr><td style="padding:18px 20px;">
          <div style="font-size:12px;font-weight:bold;color:#c89bea;letter-spacing:.6px;">ASUNTO</div>
          <div style="margin-top:8px;font-size:17px;line-height:1.45;font-weight:bold;color:#ffffff;overflow-wrap:anywhere;">${escapeHtml(cleanSubject)}</div>
          <div style="margin-top:18px;font-size:12px;font-weight:bold;color:#c89bea;letter-spacing:.6px;">RECIBIDO</div>
          <div style="margin-top:7px;font-size:14px;color:#e0d7e6;">${escapeHtml(dateLabel)}</div>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:24px 30px 30px;">
        <p style="margin:0;color:#eee6f3;font-size:14px;line-height:1.6;">Inicia sesión en <strong>Estuche Virtual</strong> y entra a <strong>PQR</strong> para leer el mensaje completo y responder.</p>
        <div style="margin-top:24px;padding-top:18px;border-top:1px solid #493653;color:#9f90a9;font-size:12px;line-height:1.5;word-break:break-all;">Referencia: ${escapeHtml(pqrId)}</div>
      </td></tr>
    </table>
    <p style="max-width:560px;margin:18px auto 0;color:#9f90a9;font-size:12px;line-height:1.5;">Aviso automático de Estuche Virtual</p>
  </td></tr></table>
</body></html>`,
    });
    if (!info.accepted?.length || info.rejected?.length) {
      return { sent: false, error: 'El servidor SMTP no aceptó el destinatario.' };
    }
    return { sent: true };
  } catch {
    // No registrar datos de destinatarios ni contenido del PQR en los logs.
    return { sent: false, error: 'El servidor SMTP no aceptó el aviso.' };
  }
}

/** Aviso al cliente por respuesta nueva y/o cambio real de estado en la plataforma. */
export async function sendPqrResponseNotification(
  email: string,
  customerName: string,
  pqrSubject: string,
  response?: string,
  status?: 'received' | 'in_progress' | 'answered' | 'closed',
): Promise<SendResult> {
  if (!mailerIsConfigured) return { sent: false, error: 'Correo SMTP no configurado.' };
  const labels = { received: 'Recibido', in_progress: 'En proceso', answered: 'Respondido', closed: 'Cerrado' };
  const statusLabel = status ? labels[status] : 'Actualizado';
  const cleanSubject = pqrSubject.replace(/[\r\n\t]+/g, ' ').trim();
  const textResponse = response?.trim() || '';
  const safeName = escapeHtml(customerName);
  const safeSubject = escapeHtml(cleanSubject);
  const safeResponse = escapeHtml(textResponse);
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to: email,
      subject: 'Actualización de tu PQR · Estuche Virtual',
      text:
        `ESTUCHE VIRTUAL | Atención al cliente\n\nHola ${customerName},\n\n` +
        `Tu solicitud tiene una actualización.\nAsunto: ${cleanSubject}\nEstado al momento del aviso: ${statusLabel}\n` +
        (textResponse ? `\nRespuesta del equipo:\n${textResponse}\n` : '') +
        `\nInicia sesión en Estuche Virtual y entra a PQR y soporte > Mis PQR para consultar el estado actual y el historial.`,
      html: `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0a10;font-family:Arial,Helvetica,sans-serif;color:#f8f4ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0c0a10;"><tr><td align="center" style="padding:36px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#15111c;border:1px solid #4a3159;border-radius:18px;">
      <tr><td style="padding:30px 30px 0;">
        <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#cf87ff;">ESTUCHE VIRTUAL</div>
        <div style="margin-top:8px;color:#b7aabd;font-size:13px;">ATENCIÓN AL CLIENTE</div>
      </td></tr>
      <tr><td style="padding:24px 30px 6px;">
        <span style="display:inline-block;border:1px solid #8445a1;border-radius:999px;background:#30143e;color:#e9c8ff;padding:6px 12px;font-size:12px;font-weight:bold;">${statusLabel}</span>
        <h1 style="margin:18px 0 10px;color:#ffffff;font-size:24px;line-height:1.25;">Tu PQR tiene novedades</h1>
        <p style="margin:0;color:#c5b9ce;font-size:15px;line-height:1.6;">Hola ${safeName}, hay una actualización en tu solicitud.</p>
      </td></tr>
      <tr><td style="padding:22px 30px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#211729;border:1px solid #4d345d;border-radius:12px;"><tr><td style="padding:18px 20px;">
          <div style="font-size:12px;font-weight:bold;color:#c89bea;letter-spacing:.6px;">ASUNTO</div>
          <div style="margin-top:8px;font-size:17px;line-height:1.45;font-weight:bold;color:#ffffff;overflow-wrap:anywhere;word-break:break-word;">${safeSubject}</div>
          <div style="margin-top:18px;font-size:12px;font-weight:bold;color:#c89bea;letter-spacing:.6px;">ESTADO AL MOMENTO DEL AVISO</div>
          <div style="margin-top:7px;font-size:14px;color:#e0d7e6;">${statusLabel}</div>
        </td></tr></table>
        ${textResponse ? `<div style="margin-top:20px;color:#c89bea;font-size:12px;font-weight:bold;letter-spacing:.6px;">RESPUESTA DEL EQUIPO</div><div style="margin-top:9px;padding:16px;background:#211729;border-left:3px solid #b044f4;border-radius:8px;color:#f5edf9;font-size:14px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${safeResponse}</div>` : ''}
      </td></tr>
      <tr><td style="padding:24px 30px 30px;">
        <p style="margin:0;color:#eee6f3;font-size:14px;line-height:1.6;">Inicia sesión en <strong>Estuche Virtual</strong> y entra a <strong>PQR y soporte &gt; Mis PQR</strong> para consultar el estado actual y el historial.</p>
      </td></tr>
    </table>
    <p style="max-width:560px;margin:18px auto 0;color:#9f90a9;font-size:12px;line-height:1.5;">Aviso automático de Estuche Virtual</p>
  </td></tr></table>
</body></html>`,
    });
    if (!info.accepted?.length || info.rejected?.length) return { sent: false, error: 'El servidor SMTP no aceptó el destinatario.' };
    return { sent: true };
  } catch {
    // No registrar datos personales ni el contenido de la respuesta.
    return { sent: false, error: 'El servidor SMTP no aceptó el aviso.' };
  }
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