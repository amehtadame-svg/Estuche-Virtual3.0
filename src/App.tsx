import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import Carrito from './pages/Carrito/Carrito';
import Catalogo from './pages/Catalogo/Catalogo';
import Contacto from './pages/Contacto/Contacto';
import Nosotros from './pages/Nosotros/Nosotros';
import Producto from './pages/Productos/Productos';
import ProductosAD from './pages/Admin/Productos/ProductosAD';
import DetalleFacturas from './pages/Admin/DetalleFactura/DetalleFacturas';
import ClienteDashboard from './pages/Clientes/ClienteDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Envios from './pages/Admin/Envios/Envios';
import Facturas from './pages/Admin/Facturas/Facturas';
import Pedidos from './pages/Admin/Pedidos/Pedidos';
import Proveedores from './pages/Admin/Proveedores/Proveedores';
import ForgotPassword from './pages/ResetPassword/ForgotPassword';
import ResetPassword  from './pages/ResetPassword/ResetPassword';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
        <Header />
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/carrito" element={<Carrito />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/producto/:id" element={<Producto />} />
            <Route path="/Contacto" element={<Contacto />} />
            <Route path="/Nosotros" element={<Nosotros />} />


            <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
              <Route path="/cliente" element={<ClienteDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/envios" element={<Envios />} />
              <Route path="/admin/facturas" element={<Facturas />} />
              <Route path="/admin/pedidos" element={<Pedidos />} />
              <Route path="/admin/productos" element={<ProductosAD />} />
              <Route path="/admin/proveedores" element={<Proveedores />} />
              <Route path="/admin/detallefacturas" element={<DetalleFacturas />} />
            </Route>
          </Routes>
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;