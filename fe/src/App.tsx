import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { CartProvider }  from './context/CartContext';
import AccessDenied from './pages/AccessDenied/AccessDenied';
import ProtectedRoute    from './components/ui/ProtectedRoute';
import Header            from './components/layout/Header';
import Footer            from './components/layout/Footer';

// Páginas públicas
import Pago           from './pages/Checkout/Checkout';
import Home           from './pages/Home/Home';
import Login          from './pages/Login/Login';
import Register       from './pages/Register/Register';
import Catalogo       from './pages/Catalog/Catalog';
import Producto       from './pages/Product/Product';
import Carrito        from './pages/Shopping/Shopping';
import Contacto       from './pages/Contact/Contact';
import Nosotros       from './pages/About/About';
import ForgotPassword from './pages/ResetPassword/ForgotPassword';
import ResetPassword  from './pages/ResetPassword/ResetPassword';

// Cliente
import ClienteDashboard from './pages/ClientDashboard/ClientDashboard';

// Admin
import AdminDashboard  from './pages/Admin/AdminDashboard';
import ProductosAD     from './pages/Admin/Products/Products';
import Pedidos         from './pages/Admin/Orders/Orders';
import Recibos          from './pages/Admin/Receipt/Receipt';
import Envios          from './pages/Admin/Despatch/Despatch';
import Proveedores     from './pages/Admin/Provider/Provider';
import Usuarios        from './pages/Admin/Users/AdminUsers';
import DetallePedidos from './pages/Admin/OrderDetails/OrderDetails';

// SuperAdmin
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import Descuentos          from './pages/SuperAdmin/PromotionalCode/PromotionalCode';
import Pagos               from './pages/SuperAdmin/Payout/Payout';
import Devoluciones        from './pages/SuperAdmin/Returns/Returns';
import Reportes            from './pages/SuperAdmin/Reports/Reports';
import UsuariosSA          from './pages/SuperAdmin/UsuariosSA/SuperAdminUsers';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Header />
          <Routes>

            {/* ── Públicas ─────────────────────────────── */}
            <Route path="/"                element={<Home />} />
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/catalogo"        element={<Catalogo />} />
            <Route path="/producto/:id"    element={<Producto />} />
            <Route path="/carrito"         element={<Carrito />} />
            <Route path="/Contacto"        element={<Contacto />} />
            <Route path="/Nosotros"        element={<Nosotros />} />
            <Route path="/no-acceso" element={<AccessDenied />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* ── Cliente ──────────────────────────────── */}
            <Route element={<ProtectedRoute allowedRoles={['client', 'employee']} />}>
              <Route path="/cliente" element={<ClienteDashboard />} />
            </Route>

            {/* ── Pago ─────────────────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/Pago" element={<Pago />} />
            </Route>

            {/* ── Admin ────────────────────────────────── */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
              <Route path="/admin"                 element={<AdminDashboard />} />
              <Route path="/admin/productos"       element={<ProductosAD />} />
              <Route path="/admin/pedidos"         element={<Pedidos />} />
              <Route path="/admin/recibos"           element={<Recibos />} />
              <Route path="/admin/envios"          element={<Envios />} />
              <Route path="/admin/proveedores"     element={<Proveedores />} />
              <Route path="/admin/usuarios"        element={<Usuarios />} />
              <Route path="/admin/detallepedidos"  element={<DetallePedidos />} />
            </Route>

            {/* ── SuperAdmin ───────────────────────────── */}
            <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
              <Route path="/superadmin"                element={<SuperAdminDashboard />} />
              <Route path="/superadmin/usuarios"       element={<UsuariosSA />} />
              <Route path="/superadmin/descuentos"     element={<Descuentos />} />
              <Route path="/superadmin/pagos"          element={<Pagos />} />
              <Route path="/superadmin/devoluciones"   element={<Devoluciones />} />
              <Route path="/superadmin/reportes"       element={<Reportes />} />
            </Route>

          </Routes>
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;