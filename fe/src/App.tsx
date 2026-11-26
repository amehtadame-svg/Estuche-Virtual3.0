import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import EmployeeWorkspace from './pages/Employee/EmployeeWorkspace';
import DeliveryWorkspace from './pages/Delivery/DeliveryWorkspace';
import CustomerPickups from './pages/Client/CustomerPickups';
import AccessDenied from './pages/AccessDenied/AccessDenied';
import CartAccess from './components/ui/CartAccess';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ToastProvider from './components/ui/ToastProvider';

import Pago from './pages/Checkout/Checkout';
import OrderStatus from './pages/OrderStatus/OrderStatus';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Catalogo from './pages/Catalog/Catalog';
import Producto from './pages/Product/Product';
import Carrito from './pages/Shopping/Shopping';
import Contacto from './pages/Contact/Contact';
import Nosotros from './pages/About/About';
import ForgotPassword from './pages/ResetPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Profile from './pages/Profile/Profile';

import MyOrders from './pages/MyOrders/MyOrders';
import ClientPqr from './pages/PQR/ClientPqr';

import AdminDashboard from './pages/Admin/AdminDashboard';
import ProductosAD from './pages/Admin/Products/Products';
import CombosAD from './pages/Admin/Combos/Combos';
import InventoryInbound from './pages/Admin/Inventory/InventoryInbound';
import InventoryOutbound from './pages/Admin/Inventory/InventoryOutbound';
import Pedidos from './pages/Admin/Orders/Orders';
import Recibos from './pages/Admin/Receipt/Receipt';
import Envios from './pages/Admin/Despatch/Despatch';
import Proveedores from './pages/Admin/Provider/Provider';
import Usuarios from './pages/Admin/Users/AdminUsers';
import DetallePedidos from './pages/Admin/OrderDetails/OrderDetails';
import AdminPqr from './pages/PQR/AdminPqr';

import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import Descuentos from './pages/SuperAdmin/PromotionalCode/PromotionalCode';
import Pagos from './pages/SuperAdmin/Payout/Payout';
import Devoluciones from './pages/SuperAdmin/Returns/Returns';
import Reportes from './pages/SuperAdmin/Reports/Reports';
import UsuariosSA from './pages/SuperAdmin/UsuariosSA/SuperAdminUsers';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <Header />

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/producto/:id" element={<Producto />} />
              <Route path="/carrito" element={<CartAccess><Carrito /></CartAccess>} />
              <Route path="/Contacto" element={<Contacto />} />
              <Route path="/Nosotros" element={<Nosotros />} />
              <Route path="/no-acceso" element={<AccessDenied />} />
              <Route
                path="/forgot-password"
                element={<ForgotPassword />}
              />
              <Route
                path="/reset-password"
                element={<ResetPassword />}
              />

              <Route
                element={
                  <ProtectedRoute allowedRoles={['client']} />
                }
              >
                <Route
                  path="/cliente"
                  element={<Navigate to="/" replace />}
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute allowedRoles={['client']} />
                }
              >
                <Route
                  path="/cliente/retiros"
                  element={<CustomerPickups />}
                />
                <Route
                  path="/cliente/pqr"
                  element={<ClientPqr />}
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      'employee',
                      'admin',
                      'superadmin',
                    ]}
                  />
                }
              >
                <Route
                  path="/empleado/*"
                  element={<EmployeeWorkspace />}
                />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['delivery']} />}><Route path="/repartidor" element={<DeliveryWorkspace />} /></Route>

              <Route element={<ProtectedRoute allowedRoles={['client', 'admin', 'superadmin']} />}>
                <Route path="/mis-pedidos" element={<MyOrders />} />
                <Route path="/pedidos/:id" element={<OrderStatus />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/Pago" element={<CartAccess><Pago /></CartAccess>} />
                <Route path="/perfil" element={<Profile />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={['admin', 'superadmin']}
                  />
                }
              >
                <Route
                  path="/admin"
                  element={<AdminDashboard />}
                />
                <Route
                  path="/admin/productos"
                  element={<ProductosAD />}
                />
                <Route
                  path="/admin/salidas"
                  element={<InventoryOutbound />}
                />
                <Route
                  path="/admin/combos"
                  element={<CombosAD />}
                />
                <Route
                  path="/admin/ingresos"
                  element={<InventoryInbound />}
                />
                <Route
                  path="/admin/pedidos"
                  element={<Pedidos />}
                />
                <Route
                  path="/admin/recibos"
                  element={<Recibos />}
                />
                <Route
                  path="/admin/envios"
                  element={<Envios />}
                />
                <Route
                  path="/admin/proveedores"
                  element={<Proveedores />}
                />
                <Route
                  path="/admin/usuarios"
                  element={<Usuarios />}
                />
                <Route
                  path="/admin/detallepedidos"
                  element={<DetallePedidos />}
                />
                <Route
                  path="/admin/pqr"
                  element={<AdminPqr />}
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={['superadmin']}
                  />
                }
              >
                <Route
                  path="/superadmin"
                  element={<SuperAdminDashboard />}
                />
                <Route
                  path="/superadmin/usuarios"
                  element={<UsuariosSA />}
                />
                <Route
                  path="/superadmin/descuentos"
                  element={<Descuentos />}
                />
                <Route
                  path="/superadmin/pagos"
                  element={<Pagos />}
                />
                <Route
                  path="/superadmin/devoluciones"
                  element={<Devoluciones />}
                />
                <Route
                  path="/superadmin/reportes"
                  element={<Reportes />}
                />
              </Route>
            </Routes>

            <Footer />
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;