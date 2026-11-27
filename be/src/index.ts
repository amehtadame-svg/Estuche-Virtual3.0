import dotenv from 'dotenv';

// Cargar variables de entorno ANTES de importar cualquier módulo que las lea
dotenv.config();

import app from './app';
import { verifyMailer } from './lib/mailer';
import { loadConfig, checkDatabase, ConfigError } from './lib/config';
import { expireEmployeeOrders } from './jobs/expire-employee-orders';

async function main() {
  // 1) Validar variables de entorno con mensajes claros (falla rápido).
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`\n❌ ${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }

  // 2) Verificar conexión real a la base de datos antes de servir tráfico.
  try {
    await checkDatabase();
    console.log('✅ Conexión a la base de datos verificada.');
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`\n❌ ${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }

  // 3) Programar el vencimiento de reservas de empleados.
  //    RESERVATION_EXPIRY_INTERVAL_MINUTES=0 (o NODE_ENV=test) lo apaga.
  const intervalMinutes = Number(
    process.env.RESERVATION_EXPIRY_INTERVAL_MINUTES ?? 5
  );
  const expiryEnabled =
    process.env.NODE_ENV !== 'test' &&
    Number.isFinite(intervalMinutes) &&
    intervalMinutes > 0;

  if (expiryEnabled) {
    const timer = setInterval(() => {
      expireEmployeeOrders().catch((error) => {
        console.error('[scheduler] Error venciendo reservas:', error);
      });
    }, intervalMinutes * 60 * 1000);
    // No impide que el proceso termine si solo quedaba este timer.
    timer.unref();
    console.log(
      `⏰ Vencimiento de reservas programado cada ${intervalMinutes} min.`
    );
  } else {
    console.log(
      '⏸️  Vencimiento de reservas automático desactivado ' +
        '(RESERVATION_EXPIRY_INTERVAL_MINUTES=0 o NODE_ENV=test).'
    );
  }

  // 4) Arrancar el servidor.
  app.listen(config.port, () => {
    console.log(`Servidor corriendo en puerto ${config.port} (${config.nodeEnv})`);
    console.log(`   Health: http://localhost:${config.port}/api/health`);
    // se ve aquí y no cuando un usuario intente recuperar su contraseña.
    void verifyMailer();
  });
}

main().catch((error) => {
  console.error('❌ Error fatal al arrancar:', error);
  process.exit(1);
});
