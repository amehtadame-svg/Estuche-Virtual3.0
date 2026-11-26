import wishlistRoutes from './modules/wishlist/wishlist.routes';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { prisma } from './lib/prisma';

import supportRoutes from './modules/support/support.routes';
import paymentRoutes from './modules/payments/payments.routes';
import clientRoutes from './modules/client/client.routes';
import supervisionRoutes from './modules/supervision/supervision.routes';
import deliveryRoutes from './modules/delivery/delivery.routes';
import employeeRoutes from './modules/employee/employee.routes';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import orderRoutes from './modules/orders/orders.routes';
import productRoutes from './modules/products/products.routes';
import categoryRoutes from './modules/categories/categories.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import providerRoutes from './modules/provider/provider.routes';
import despatchRoutes from './modules/despatch/despatch.routes';
import orderDetailRoutes from './modules/order-details/order-details.routes';
import receiptRoutes from './modules/receipt/receipt.routes';
import shoppingRoutes from './modules/shopping/shopping.routes';
import promotionalCodeRoutes from './modules/promotional-code/promotional-code.routes';
import payoutRoutes from './modules/payout/payout.routes';
import returnRoutes from './modules/returns/returns.routes';
import pqrRoutes from './modules/pqr/pqr.routes';
import reportRoutes from './modules/reports/reports.routes';
import comboRoutes from './modules/combos/combos.routes';
import { errorHandler } from './middlewares/error.middleware';

const CORS_ORIGINS = (
  process.env.CORS_ORIGINS ??
  'http://localhost:5173,https://*.app.github.dev'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const originIsAllowed = (origin: string) =>
  CORS_ORIGINS.some((allowed) => {
    if (!allowed.includes('*')) {
      return allowed === origin;
    }

    const pattern = allowed
      .split('*')
      .map((part) =>
        part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      )
      .join('.*');

    return new RegExp(`^${pattern}$`).test(origin);
  });

const authLimiter = rateLimit({
  windowMs: Number(
    process.env.RATE_LIMIT_WINDOW_MS ??
    15 * 60 * 1000
  ),
  limit: Number(process.env.RATE_LIMIT_MAX ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiados intentos. Intenta de nuevo más tarde.',
  },
});

const app = express();

app.use(helmet());

// ── Health / disponibilidad (público, sin auth) ──────────────────────────
// GET /api/health        → estado del proceso
// GET /api/health/ready  → incluye ping real a la base de datos
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'estuche-virtual-api',
    env: process.env.NODE_ENV ?? 'development',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'up',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'not-ready',
      database: 'down',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || originIsAllowed(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

app.use('/api/support', supportRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/supervision', supervisionRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/despatches', despatchRoutes);
app.use('/api/order-details', orderDetailRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/lista-deseos', wishlistRoutes);
app.use('/api/combos', comboRoutes);

app.use('/api/promotional-codes', promotionalCodeRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/pqr', pqrRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

export default app;