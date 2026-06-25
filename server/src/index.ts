import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import pedidosRoutes from './routes/pedidos.routes';
import productosRoutes from './routes/productos.routes';
import proveedoresRoutes from './routes/proveedores.routes';
import enviosRoutes from './routes/envios.routes';
import detallePedidoRoutes from './routes/detallepedido.routes';
import facturasRoutes from './routes/facturas.routes';


dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/envios', enviosRoutes);
app.use('/api/detalle-pedido', detallePedidoRoutes);
app.use('/api/facturas', facturasRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));