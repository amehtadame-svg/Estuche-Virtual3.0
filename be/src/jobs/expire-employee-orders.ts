import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { employeeService } from '../modules/employee/employee.service';

/**
 * Libera las reservas de empleados vencidas (pending sin pago y con
 * expiresAt pasado), devolviendo el stock al inventario.
 *
 * Es la lógica compartida entre:
 *  - el script manual:  pnpm employee:expire
 *  - el scheduler automático del servidor (src/index.ts)
 */
export async function expireEmployeeOrders(): Promise<number> {
  const orders = await prisma.order.findMany({
    where: {
      createdById: {
        not: null,
      },
      deletedAt: null,
      status: 'pending',
      stockReleasedAt: null,
      expiresAt: {
        lte: new Date(),
      },
    },
    select: {
      id: true,
    },
    take: 200,
  });

  let released = 0;

  for (const order of orders) {
    try {
      await employeeService.cancel(
        order.id,
        'Reserva vencida sin pago.',
        null,
        true
      );

      console.log('Reserva liberada:', order.id);
      released += 1;
    } catch (error) {
      console.error(
        'Revisar reserva:',
        order.id,
        error instanceof Error ? error.message : 'Error'
      );

      process.exitCode = 1;
    }
  }

  return released;
}

// Ejecución directa (pnpm employee:expire): solo corre si se invoca como
// script, no al importar el módulo desde el scheduler.
if (require.main === module) {
  expireEmployeeOrders()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
