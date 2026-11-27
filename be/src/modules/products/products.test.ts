import {
  test,
  before,
  after,
} from 'node:test';
import assert from 'node:assert';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

process.env.JWT_SECRET =
  'test-secret-min-32-characters-long!!';
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/test';

const app = require('../../app').default;

const { prisma } =
  require('../../lib/prisma') as {
    prisma: any;
  };

import { productService } from './products.service';
import { HttpError } from '../../lib/errors';

let server: Server;
let base: string;

before(async () => {
  prisma.product.findMany = async () => [];

  server = createServer(app);

  await new Promise<void>((resolve) =>
    server.listen(0, () => resolve())
  );

  const { port } =
    server.address() as AddressInfo;

  base = `http://127.0.0.1:${port}`;
});

after(
  () =>
    new Promise<void>((resolve) =>
      server.close(() => resolve())
    )
);

const UUID =
  '00000000-0000-7000-8000-000000000000';

const WRITE_ROUTES: Array<{
  label: string;
  method: string;
  path: string;
}> = [
  {
    label: 'crear producto',
    method: 'POST',
    path: '/api/products',
  },
  {
    label: 'editar producto',
    method: 'PUT',
    path: `/api/products/${UUID}`,
  },
  {
    label: 'borrar producto',
    method: 'DELETE',
    path: `/api/products/${UUID}`,
  },
  {
    label: 'crear proveedor',
    method: 'POST',
    path: '/api/providers',
  },
  {
    label: 'listar proveedores',
    method: 'GET',
    path: '/api/providers',
  },
  {
    label: 'editar proveedor',
    method: 'PUT',
    path: `/api/providers/${UUID}`,
  },
  {
    label: 'borrar proveedor',
    method: 'DELETE',
    path: `/api/providers/${UUID}`,
  },
  {
    label: 'crear factura',
    method: 'POST',
    path: '/api/receipts',
  },
  {
    label: 'listar facturas',
    method: 'GET',
    path: '/api/receipts',
  },
  {
    label: 'editar factura',
    method: 'PUT',
    path: `/api/receipts/${UUID}`,
  },
  {
    label: 'borrar factura',
    method: 'DELETE',
    path: `/api/receipts/${UUID}`,
  },
  {
    label: 'crear envío',
    method: 'POST',
    path: '/api/despatches',
  },
  {
    label: 'listar envíos',
    method: 'GET',
    path: '/api/despatches',
  },
  {
    label: 'editar envío',
    method: 'PUT',
    path: `/api/despatches/${UUID}`,
  },
  {
    label: 'borrar envío',
    method: 'DELETE',
    path: `/api/despatches/${UUID}`,
  },
  {
    label: 'crear detalle de pedido',
    method: 'POST',
    path: '/api/order-details',
  },
  {
    label: 'listar detalles de pedido',
    method: 'GET',
    path: '/api/order-details',
  },
  {
    label: 'editar detalle de pedido',
    method: 'PUT',
    path: `/api/order-details/${UUID}`,
  },
  {
    label: 'borrar detalle de pedido',
    method: 'DELETE',
    path: `/api/order-details/${UUID}`,
  },
];

test(
  'C-01: las rutas protegidas responden 401 sin token',
  async () => {
    for (
      const {
        label,
        method,
        path,
      } of WRITE_ROUTES
    ) {
      const res = await fetch(
        base + path,
        { method }
      );

      assert.strictEqual(
        res.status,
        401,
        `${method} ${path} (${label}) debería responder 401 sin token y respondió ${res.status}`
      );
    }
  }
);

test(
  'C-01: las rutas protegidas responden 401 con token inválido',
  async () => {
    for (
      const {
        method,
        path,
      } of WRITE_ROUTES
    ) {
      const res = await fetch(
        base + path,
        {
          method,
          headers: {
            Authorization:
              'Bearer token-invalido-abcdef',
          },
        }
      );

      assert.strictEqual(
        res.status,
        401,
        `${method} ${path} debería responder 401 con token inválido y respondió ${res.status}`
      );
    }
  }
);

test(
  'C-01: GET /api/products sigue siendo público (catálogo sin sesión)',
  async () => {
    const res = await fetch(
      base + '/api/products'
    );

    assert.strictEqual(
      res.status,
      200
    );

    assert.deepStrictEqual(
      await res.json(),
      []
    );
  }
);

test(
  'HU-001 (CA-001.2): rechaza precio <= 0, costo <= 0 o stock < 0',
  async () => {
    await assert.rejects(
      productService.create({
        name: 'Regla 30cm',
        price: 0,
        cost: 1000,
        stock: 5,
      }),
      (err: HttpError) =>
        err.status === 400 &&
        /El precio de venta y el costo de adquisición deben ser valores numéricos estrictamente mayores a cero/.test(
          err.message
        )
    );

    await assert.rejects(
      productService.create({
        name: 'Regla 30cm',
        price: 2500,
        cost: 0,
        stock: 5,
      }),
      (err: HttpError) =>
        err.status === 400
    );

    await assert.rejects(
      productService.create({
        name: 'Regla 30cm',
        price: 2500,
        cost: 1200,
        stock: -3,
      }),
      (err: HttpError) =>
        err.status === 400
    );
  }
);

test(
  'HU-001 (CA-001.3): rechaza producto duplicado por SKU, código de barras o nombre',
  async () => {
    const origFindFirst =
      prisma.product.findFirst;

    prisma.product.findFirst =
      async () => ({
        id: UUID,
        name: 'Cuaderno Cosido 100 Hojas',
        sku: 'EV-001',
      });

    try {
      await assert.rejects(
        productService.create({
          name: 'Cuaderno Cosido 100 Hojas',
          sku: 'EV-001',
          price: 12500,
          cost: 7500,
          stock: 10,
        }),
        (err: HttpError) =>
          err.status === 400 &&
          /Ya existe un producto almacenado con el mismo código SKU o nombre comercial/.test(
            err.message
          )
      );
    } finally {
      prisma.product.findFirst =
        origFindFirst;
    }
  }
);

test(
  'HU-001 (CA-001.4): crea producto con SKU, código de barras, costo, categoría y movimiento inicial',
  async () => {
    const origFindFirst =
      prisma.product.findFirst;

    const origCreate =
      prisma.product.create;

    const origMovCreate =
      prisma.inventoryMovement.create;
    const origTransaction = prisma.$transaction;
    prisma.$transaction = async (fn: any) => fn(prisma);

    let createdData: any = null;
    let createdMovement: any = null;

    prisma.product.findFirst =
      async () => null;

    prisma.product.create =
      async (args: any) => {
        createdData = args.data;

        return {
          id: UUID,
          ...args.data,
        };
      };

    prisma.inventoryMovement.create =
      async (args: any) => {
        createdMovement = args.data;

        return {
          id: 'mov-1',
          ...args.data,
        };
      };

    try {
      const prod =
        await productService.create(
          {
            name:
              'Compás de precisión metálico',
            sku: 'EV-099',
            barcode: '7701234567099',
            cost: 6000,
            price: 10500,
            stock: 25,
            stockMin: 6,
            categoryId: UUID,
          },
          'admin-1'
        );

      assert.strictEqual(
        prod.sku,
        'EV-099'
      );

      assert.strictEqual(
        prod.barcode,
        '7701234567099'
      );

      assert.strictEqual(
        createdData.cost,
        6000
      );

      assert.strictEqual(
        createdData.price,
        10500
      );

      assert.strictEqual(
        createdData.stock,
        25
      );

      assert.strictEqual(
        createdData.stockMin,
        6
      );

      assert.strictEqual(
        createdData.categoryId,
        UUID
      );

      assert.ok(
        createdMovement,
        'debe registrar movimiento inicial de entrada en inventario'
      );

      assert.strictEqual(createdMovement.reason, 'Stock inicial de registro de producto');

      assert.strictEqual(
        createdMovement.type,
        'in'
      );

      assert.strictEqual(
        createdMovement.quantity,
        25
      );
    } finally {
      prisma.product.findFirst =
        origFindFirst;

      prisma.product.create =
        origCreate;

      prisma.inventoryMovement.create =
        origMovCreate;
      prisma.$transaction = origTransaction;
    }
  }
);
test('Un fallo en el movimiento inicial revierte la creación del producto', async () => {
  const findFirst = prisma.product.findFirst;
  const transaction = prisma.$transaction;
  let committed = false;
  let attempts = 0;
  prisma.product.findFirst = async () => null;
  prisma.$transaction = async (fn: any) => {
    const tx = {
      product: { create: async () => { attempts++; return { id: UUID }; } },
      productImage: { create: async () => ({}) },
      inventoryMovement: { create: async () => { throw new Error('falló el movimiento'); } },
    };
    const result = await fn(tx);
    committed = true;
    return result;
  };
  try {
    await assert.rejects(productService.create({ name: 'Producto', price: 100, stock: 1 }), /falló el movimiento/);
    assert.equal(attempts, 1);
    assert.equal(committed, false);
  } finally {
    prisma.product.findFirst = findFirst;
    prisma.$transaction = transaction;
  }
});

test('La búsqueda de SKU y código de barras incluye productos eliminados', async () => {
  const findFirst = prisma.product.findFirst;
  let query: any;
  prisma.product.findFirst = async (args: any) => { query = args; return { id: UUID }; };
  try {
    await assert.rejects(productService.create({ name: 'Nuevo', sku: 'SKU-01', barcode: '123', price: 10 }), HttpError);
    assert.equal(query.where.deletedAt, undefined);
    assert.equal(query.where.OR[0].deletedAt, null);
    assert.equal(query.where.OR[1].sku.equals, 'SKU-01');
    assert.equal(query.where.OR[2].barcode.equals, '123');
  } finally { prisma.product.findFirst = findFirst; }
});
