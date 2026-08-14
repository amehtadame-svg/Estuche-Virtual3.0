import { useAuth } from '../../hooks/useAuth';

const announcements = [
  'Envío gratis en pedidos superiores a $120.000',
  'Nueva colección 2026 ya disponible',
  'Devoluciones fáciles hasta 30 días',
  'Compra protegida · Pago 100% seguro',
];

function AnnouncementItems() {
  return (
    <div className="flex shrink-0 items-center">
      {announcements.map((announcement) => (
        <span
          key={announcement}
          className="flex items-center whitespace-nowrap px-7 text-[11px] font-medium tracking-[0.08em] text-white/70 sm:px-10 sm:text-xs">

          <span className="mr-7 h-1.5 w-1.5 rounded-full bg-grape-400 shadow-[0_0_10px_rgba(201,123,255,0.8)] sm:mr-10" />
          {announcement}
        </span>
      ))}
    </div>
  );
}

export default function AnnouncementBar() {
  const { user } = useAuth();

  const isManagementUser =
    user?.role === 'administrador' || user?.role === 'superadmin';

  if (isManagementUser) {
    return null;
  }

  return (
    <section
      aria-label="Promotional announcements"
      className="overflow-hidden border-b border-white/[0.08] bg-night-950 py-2.5">
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <AnnouncementItems />
        <AnnouncementItems />
      </div>
    </section>
  );
}