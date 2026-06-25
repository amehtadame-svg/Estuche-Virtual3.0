import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { CartProvider }  from './context/CartContext';
import ProtectedRoute    from './components/ProtectedRoute';
import Header            from './components/Header/Header';
import Footer            from './components/Footer/Footer';

// Páginas públicas
import Pago          from './pages/Pago/Pago';
import Home          from './pages/Home/Home';
import Login         from './pages/Login/Login';
import Register      from './pages/Register/Register';
import Catalogo      from './pages/Catalogo/Catalogo';
import Producto      from './pages/Productos/Productos';
import Carrito       from './pages/Carrito/Carrito';
import Contacto      from './pages/Contacto/Contacto';
import Nosotros      from './pages/Nosotros/Nosotros';
import ForgotPassword from './pages/ResetPassword/ForgotPassword';
import ResetPassword  from './pages/ResetPassword/ResetPassword';

// Cliente
import ClienteDashboard from './pages/Clientes/ClienteDashboard';

// Admin
import AdminDashboard  from './pages/Admin/AdminDashboard';
import ProductosAD     from './pages/Admin/Productos/ProductosAD';
import Pedidos         from './pages/Admin/Pedidos/Pedidos';
import Facturas        from './pages/Admin/Facturas/Facturas';
import DetalleFacturas from './pages/Admin/DetalleFactura/DetalleFacturas';
import Envios          from './pages/Admin/Envios/Envios';
import Proveedores     from './pages/Admin/Proveedores/Proveedores';
import Usuarios        from './pages/Admin/Usuarios/Usuarios';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Header />
          <Routes>

            {/* Públicas */}
            <Route path="/"                element={<Home />} />
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/catalogo"        element={<Catalogo />} />
            <Route path="/producto/:id"    element={<Producto />} />
            <Route path="/carrito"         element={<Carrito />} />
            <Route path="/Contacto"        element={<Contacto />} />
            <Route path="/Nosotros"        element={<Nosotros />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* Cliente y Empleado */}
            <Route element={<ProtectedRoute allowedRoles={['cliente', 'empleado']} />}>
            <Route path="/cliente" element={<ClienteDashboard />} />
            </Route>

            {/* Pago */}
            <Route element={<ProtectedRoute />}>
            <Route path="/Pago" element={<Pago />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
              <Route path="/admin"                   element={<AdminDashboard />} />
              <Route path="/admin/productos"         element={<ProductosAD />} />
              <Route path="/admin/pedidos"           element={<Pedidos />} />
              <Route path="/admin/facturas"          element={<Facturas />} />
              <Route path="/admin/detallefacturas"   element={<DetalleFacturas />} />
              <Route path="/admin/envios"            element={<Envios />} />
              <Route path="/admin/proveedores"       element={<Proveedores />} />
              <Route path="/admin/usuarios"          element={<Usuarios />} />
            </Route>

          </Routes>
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;