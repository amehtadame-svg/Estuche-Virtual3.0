import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import authRoutes            from './modules/auth/auth.routes';
import userRoutes            from './modules/users/users.routes';
import orderRoutes           from './modules/orders/orders.routes';
import productRoutes         from './modules/products/products.routes';
import providerRoutes        from './modules/provider/provider.routes';
import despatchRoutes        from './modules/despatch/despatch.routes';
import orderDetailRoutes     from './modules/order-details/order-details.routes';
import receiptRoutes         from './modules/receipt/receipt.routes';
import shoppingRoutes        from './modules/shopping/shopping.routes';
import promotionalCodeRoutes from './modules/promotional-code/promotional-code.routes';
import payoutRoutes          from './modules/payout/payout.routes';
import returnRoutes          from './modules/returns/returns.routes';
import reportRoutes          from './modules/reports/reports.routes';
import { errorHandler }      from './middlewares/error.middleware';

// C-06 / RNF-001.4: CORS con lista blanca explícita por variable de entorno.
// Nunca un comodín: en producción solo se aceptan los orígenes declarados.
// Se admiten patrones con '*' en el subdominio (p. ej. https://*.app.github.dev)
// para entornos de preview (Codespaces) cuyo host cambia en cada sesión.
const CORS_ORIGINS = (
  process.env.CORS_ORIGINS ?? 'http://localhost:5173,https://*.app.github.dev'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const originIsAllowed = (origin: string) =>
  CORS_ORIGINS.some((allowed) => {
    if (!allowed.includes('*')) return allowed === origin;
    const pattern = allowed
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(`^${pattern}$`).test(origin);
  });

// C-06 / RNF-001.3: rate limiting en los endpoints de autenticación.
// Por defecto 10 peticiones cada 15 minutos por IP (configurable por env).
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  limit: Number(process.env.RATE_LIMIT_MAX ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Intenta de nuevo más tarde.' },
});

const app = express();

// Cabeceras de seguridad HTTP (helmet) antes que cualquier ruta.
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Peticiones sin origin (curl, Postman, server-to-server) se permiten.
      if (!origin || originIsAllowed(origin)) return callback(null, true);
      return callback(null, false); // bloquea: no fija header CORS
    },
    credentials: true,
  })
);
app.use(express.json());

// ── Públicas / compartidas ────────────────────────────
app.use('/api/auth',               authLimiter, authRoutes);
app.use('/api/users',              userRoutes);
app.use('/api/orders',             orderRoutes);
app.use('/api/products',           productRoutes);
app.use('/api/providers',          providerRoutes);
app.use('/api/despatches',         despatchRoutes);
app.use('/api/order-details',      orderDetailRoutes);
app.use('/api/receipts',           receiptRoutes);
app.use('/api/shopping',           shoppingRoutes);

// ── SuperAdmin ────────────────────────────────────────
app.use('/api/promotional-codes',  promotionalCodeRoutes);
app.use('/api/payouts',            payoutRoutes);
app.use('/api/returns',            returnRoutes);
app.use('/api/reports',            reportRoutes);

// Manejador global de errores (debe ir al final)
app.use(errorHandler);

export default app;
