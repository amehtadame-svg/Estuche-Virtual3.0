import {
  atomic,
  assertUnmanaged,
} from '../employee/employee.domain';
import { notFound } from '../../lib/errors';
import { prisma } from '../../lib/prisma';

export const orderDetailService = {
  list() {
    return prisma.orderDetail.findMany({
      include: {
        order: {
          select: {
            id: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  },

  async create(
    data: {
      orderId: string;
      productId: string;
      quantity: number;
      unitPrice: number;
    }
  ) {
    return atomic(async (tx) => {
      await assertUnmanaged(
        tx,
        data.orderId
      );

      return tx.orderDetail.create({
        data: {
          ...data,
          subtotal:
            data.quantity *
            data.unitPrice,
        },
      });
    });
  },

  async update(
    id: string,
    data: {
      orderId?: string;
      productId?: string;
      quantity?: number;
      unitPrice?: number;
    }
  ) {
    return atomic(async (tx) => {
      const detail =
        await tx.orderDetail.findUnique({
          where: {
            id,
          },
        });

      if (!detail) {
        throw notFound();
      }

      const orderIds = [
        ...new Set(
          [
            detail.orderId,
            data.orderId,
          ].filter(Boolean)
        ),
      ].sort();

      for (const orderId of orderIds) {
        await assertUnmanaged(
          tx,
          orderId!
        );
      }

      return tx.orderDetail.update({
        where: {
          id,
        },
        data,
      });
    });
  },

  async remove(id: string) {
    return atomic(async (tx) => {
      const detail =
        await tx.orderDetail.findUnique({
          where: {
            id,
          },
        });

      if (!detail) {
        throw notFound();
      }

      await assertUnmanaged(
        tx,
        detail.orderId
      );

      await tx.orderDetail.delete({
        where: {
          id,
        },
      });

      return null;
    });
  },
};