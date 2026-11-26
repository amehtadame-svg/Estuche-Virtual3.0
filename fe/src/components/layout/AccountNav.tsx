import { NavLink } from 'react-router-dom';
import { LifeBuoy, Package, Store, UserRound, Undo2, Mail, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './AccountNav.css';

export default function AccountNav() {
  const { user } = useAuth();
  if (user?.role !== 'client') return null;
  return <nav className="account-nav" aria-label="Mi cuenta">
    <NavLink to="/perfil"><UserRound size={17} /> Mi perfil</NavLink>
    <NavLink to="/mis-favoritos"><Heart size={17} /> Mis favoritos</NavLink>
    <NavLink to="/mis-pedidos"><Package size={17} /> Mis pedidos</NavLink>
    <NavLink to="/cliente/retiros"><Store size={17} /> Retiros en tienda</NavLink>
    <NavLink to="/mis-devoluciones"><Undo2 size={17} /> Devoluciones</NavLink>
    <NavLink to="/Contacto"><Mail size={17} /> Contacto</NavLink>
    <NavLink to="/cliente/pqr"><LifeBuoy size={17} /> Ayuda y PQR</NavLink>
  </nav>;
}
