import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import authRoutes         from './routes/auth.routes';
import usuariosRoutes     from './routes/usuarios.routes';
import pedidosRoutes      from './routes/pedidos.routes';
import productosRoutes    from './routes/productos.routes';
import proveedoresRoutes  from './routes/proveedores.routes';
import enviosRoutes       from './routes/envios.routes';
import detallePedidoRoutes from './routes/detallepedido.routes';
import facturasRoutes     from './routes/facturas.routes';
import descuentosRoutes   from './routes/descuentos.routes';
import pagosRoutes        from './routes/pagos.routes';
import devolucionesRoutes from './routes/devoluciones.routes';
import reportesRoutes     from './routes/reportes.routes';

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Públicas / compartidas ────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/usuarios',       usuariosRoutes);
app.use('/api/pedidos',        pedidosRoutes);
app.use('/api/productos',      productosRoutes);
app.use('/api/proveedores',    proveedoresRoutes);
app.use('/api/envios',         enviosRoutes);
app.use('/api/detallePedidos', detallePedidoRoutes);
app.use('/api/facturas',       facturasRoutes);

// ── SuperAdmin ────────────────────────────────────────
app.use('/api/descuentos',     descuentosRoutes);
app.use('/api/pagos',          pagosRoutes);
app.use('/api/devoluciones',   devolucionesRoutes);
app.use('/api/reportes',       reportesRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));