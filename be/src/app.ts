import express from 'express';
import cors from 'cors';

import authRoutes          from './modules/auth/auth.routes';
import usuariosRoutes      from './modules/usuarios/usuarios.routes';
import pedidosRoutes       from './modules/pedidos/pedidos.routes';
import productosRoutes     from './modules/productos/productos.routes';
import proveedoresRoutes   from './modules/proveedores/proveedores.routes';
import enviosRoutes        from './modules/envios/envios.routes';
import detallePedidoRoutes from './modules/detallepedido/detallepedido.routes';
import facturasRoutes      from './modules/facturas/facturas.routes';
import descuentosRoutes    from './modules/descuentos/descuentos.routes';
import pagosRoutes         from './modules/pagos/pagos.routes';
import devolucionesRoutes  from './modules/devoluciones/devoluciones.routes';
import reportesRoutes      from './modules/reportes/reportes.routes';
import carritoRoutes       from './modules/carrito/carrito.routes';

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
app.use('/api/carrito', carritoRoutes);

// ── SuperAdmin ────────────────────────────────────────
app.use('/api/descuentos',     descuentosRoutes);
app.use('/api/pagos',          pagosRoutes);
app.use('/api/devoluciones',   devolucionesRoutes);
app.use('/api/reportes',       reportesRoutes);

export default app;
