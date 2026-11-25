import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { employeeService } from '../modules/employee/employee.service';

async function run() {
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

  for (const order of orders) {
    try {
      await employeeService.cancel(
        order.id,
        'Reserva vencida sin pago.',
        null,
        true
      );

      console.log('Reserva liberada:', order.id);
    } catch (error) {
      console.error(
        'Revisar reserva:',
        order.id,
        error instanceof Error
          ? error.message
          : 'Error'
      );

      process.exitCode = 1;
    }
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());