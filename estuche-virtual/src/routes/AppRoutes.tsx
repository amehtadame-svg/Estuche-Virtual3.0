import { Routes, Route } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

import Home from '../pages/Home';
import Login from '../pages/LoginPage';
import Registro from '../pages/RegistroPage';
import AdministradoresList from '../pages/administradores/AdministradoresList';
import UsuariosList from '../pages/usuarios/UsuariosList';
import ProductosList from '../pages/productos/ProductosList';
import PedidosList from '../pages/pedidos/PedidosList';
import FacturasList from '../pages/facturas/FacturasList';
import DetalleFacturasList from '../pages/detalle-facturas/DetalleFacturasList';
import EnviosList from '../pages/envios/EnviosList';
import ProveedoresList from '../pages/proveedores/ProveedoresList';
import Nosotros from '../pages/nosotros/nosotro';
import Contacto from '../pages/contacto/contacto';
import Carrito from '../pages/carrito/carrito';


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />
        <Route path="administradores" element={<AdministradoresList />} />
        <Route path="usuarios" element={<UsuariosList />} />
        <Route path="productos" element={<ProductosList />} />
        <Route path="pedidos" element={<PedidosList />} />
        <Route path="facturas" element={<FacturasList />} />
        <Route path="detalle-facturas" element={<DetalleFacturasList />} />
        <Route path="envios" element={<EnviosList />} />
        <Route path="proveedores" element={<ProveedoresList />} />
        <Route path="carrito" element={<Carrito />} />
        <Route path="contacto" element={<Contacto />} />
        <Route path="nosotros" element={<Nosotros />} />
      </Route>
    </Routes>
  );
}