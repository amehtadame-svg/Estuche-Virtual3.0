import PhoneInput from '../../components/ui/PhoneInput';
import { validPhone } from '../../lib/phone';
import AccountNav from '../../components/layout/AccountNav';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Camera, LogOut, Save, UserRound, Package, Undo2, LifeBuoy, ArrowUpRight, ShieldCheck, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API, authHeaders } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { notify } from '../../lib/notifications';
import './Profile.css';

type ProfileData = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
};

const photoKey = (id: string) => `profile-photo:${id}`;

function makeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const x = (image.naturalWidth - side) / 2;
      const y = (image.naturalHeight - side) / 2;

      canvas.width = 360;
      canvas.height = 360;

      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No se pudo procesar la imagen.'));
        return;
      }

      context.drawImage(image, x, y, side, side, 0, 0, 360, 360);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('El archivo no se pudo abrir como imagen.'));
    };

    image.src = objectUrl;
  });
}

export default function Profile() {
  const { user, logout, updateUserName } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const saveLatch = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<string | null>(() =>
    user ? localStorage.getItem(photoKey(user.id)) : null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [savedNotice, setSavedNotice] = useState('');
  const dirty = Boolean(profile) && (name !== profile?.fullName || phone !== (profile?.phone ?? '') || address !== (profile?.address ?? ''));
  const completion = [profile?.fullName, profile?.email, profile?.phone, profile?.address].filter(value => value?.trim()).length * 25;

  useEffect(() => {
    if (!userId) return;
    setLoading(true); setLoadError('');
    setPhoto(localStorage.getItem(photoKey(userId)));
    let cancelled = false;

    fetch(`${API.users}/${userId}`, { headers: authHeaders() })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || 'No se pudo cargar tu perfil.');
        }

        return data as ProfileData;
      })
      .then((data) => {
        if (cancelled) return;

        setProfile(data);
        setName(data.fullName || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, refresh]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || saveLatch.current || !dirty) return;
    if (!validPhone(phone.trim())) { setSavedNotice('Escribe un indicativo de país y un número de 10 dígitos.'); return; }
    saveLatch.current = true;
    setSavedNotice('');
    setSaving(true);

    try {
      const response = await fetch(`${API.users}/${user.id}/profile`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fullName: name.trim(), phone: phone.trim(), address: address.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudieron guardar los cambios.');
      }

      setProfile(data as ProfileData);
      setName(data.fullName);
      setPhone(data.phone ?? ''); setAddress(data.address ?? '');
      setSavedNotice('Tus cambios se guardaron correctamente.');
      updateUserName(data.fullName);

      notify.success(
        'Tus datos se guardaron correctamente.',
        'Cambios guardados',
      );
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los cambios.',
        'Error al guardar los cambios',
      );
    } finally {
      saveLatch.current = false;
      setSaving(false);
    }
  };

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Elige un archivo de imagen.', 'Formato no válido');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      notify.error(
        'La foto debe pesar menos de 8 MB.',
        'Archivo demasiado grande',
      );
      return;
    }

    try {
      const imageData = await makeAvatar(file);

      localStorage.setItem(photoKey(user.id), imageData);
      setPhoto(imageData);
      notify.success('Foto guardada en este dispositivo.', 'Foto guardada');
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la foto.',
        'No se pudo guardar la foto',
      );
    }
  };

  const removePhoto = () => {
    if (!user) return;

    localStorage.removeItem(photoKey(user.id));
    setPhoto(null);
    notify.success('Se quitó la foto de este dispositivo.', 'Foto eliminada');
  };

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <main className="profile-page">
      <section className="profile-wrap">
      <AccountNav />
        <header className="profile-heading">
          <div>
            <span className="profile-eyebrow">MI CUENTA</span>
<h1>Mi perfil</h1>
            <p>Hola, {user?.name?.split(/\s+/)[0] || 'qué gusto verte'}. Este es tu espacio para gestionar tu cuenta.</p>
          </div>

          <span className="profile-account-mark">
            <UserRound size={18} /> {user?.role === 'superadmin' ? 'Cuenta administrativa' : 'Mi cuenta'}
          </span>
        </header>

        {user?.role === 'client' && <section className="profile-shortcuts" aria-label="Accesos de mi cuenta">
          <Link to="/mis-pedidos"><Package size={22} /><div><strong>Mis pedidos</strong><span>Sigue tus compras y entregas</span></div><ArrowUpRight size={17} /></Link>
          <Link to="/mis-devoluciones"><Undo2 size={22} /><div><strong>Devoluciones</strong><span>Solicita una revisión y sigue su estado</span></div><ArrowUpRight size={17} /></Link>
          <Link to="/cliente/pqr"><LifeBuoy size={22} /><div><strong>Estamos para ayudarte</strong><span>Consulta o envía tus PQR</span></div><ArrowUpRight size={17} /></Link>
        </section>}
        <div className="profile-layout">
          <aside className="profile-photo-card">
            <div className="profile-avatar" aria-label="Foto de perfil">
              {photo ? (
                <img src={photo} alt="Tu foto de perfil" />
              ) : (
                <span>{initials || <UserRound size={42} />}</span>
              )}
            </div>

            <span className="profile-client-badge"><ShieldCheck size={14} /> Cuenta personal</span>
            <h2>{profile?.fullName || user?.name || 'Tu perfil'}</h2>
            <p>{profile?.email || user?.email}</p>
            {user?.role === 'superadmin' && <p>Superadministrador · acceso de gestión</p>}

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              hidden
            />

            <button
              className="profile-photo-action"
              type="button"
              onClick={() => fileInput.current?.click()}
            >
              <Camera size={17} /> {photo ? 'Cambiar foto' : 'Agregar foto'}
            </button>

            {photo && (
              <button
                className="profile-photo-remove"
                type="button"
                onClick={removePhoto}
              >
                Quitar foto
              </button>
            )}

            <div className="profile-completion"><div><strong>Tu perfil</strong><span>{completion}% completo</span></div><progress value={completion} max={100} aria-label="Datos del perfil completados" /><p>{completion === 100 ? '¡Todo listo para tu próxima compra!' : 'Completa tu celular y dirección para comprar con menos pasos.'}</p></div>
            <p className="profile-photo-note">
              La foto se guarda solo en este navegador y dispositivo.
            </p>
          </aside>

          <form className="profile-form-card" onSubmit={handleSave}>
            <div className="profile-card-title">
              <div>
                <h2>Datos personales</h2>
                <p>El correo de tu cuenta no se puede editar aquí.</p>
              </div>
            </div>

            {loadError && <p className="profile-inline-error" role="alert">{loadError} <button type="button" className="ui-btn" onClick={() => setRefresh(value => value + 1)}>Reintentar</button></p>}
            {savedNotice && <p className="profile-inline-notice" role="status"><Check size={16} /> {savedNotice}</p>}
            {loading ? (
              <div className="profile-loading">Cargando tus datos…</div>
            ) : !loadError && (
              <fieldset className="profile-fields" disabled={saving}>
                <label className="profile-field">
                  <span>Nombre completo</span>
                  <input
                    required
                    maxLength={150}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                  />
                </label>

                <label className="profile-field">
                  <span>Correo electrónico</span>
                  <input
                    value={profile?.email || user?.email || ''}
                    readOnly
                    disabled
                    autoComplete="email"
                  />
                </label>

                <div className="profile-field">
                  <span>Teléfono</span>
                  <PhoneInput value={phone} onChange={setPhone} />
                </div>

                <label className="profile-field">
                  <span>Dirección</span>
                  <textarea
                    maxLength={255}
                    rows={3}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    autoComplete="street-address"
                    placeholder={user?.role === 'superadmin' ? 'Añade tu dirección de contacto' : 'Añade tu dirección de entrega'}
                  />
                </label>

                <div className="profile-form-footer">
                  {dirty && <button type="button" className="ui-btn" onClick={() => { if (profile) { setName(profile.fullName); setPhone(profile.phone ?? ''); setAddress(profile.address ?? ''); setSavedNotice(''); } }}>Descartar cambios</button>}
                  <button
                    className="profile-save-btn"
                    type="submit"
                    disabled={saving || !dirty}
                  >
                    <Save size={17} />
                    {saving ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Datos actualizados'}
                  </button>
                </div>
                <p className="profile-security-note"><ShieldCheck size={15} /> Tu correo identifica tu cuenta y no se puede cambiar aquí. <Link to="/forgot-password">Recuperar contraseña</Link></p>
              </fieldset>
            )}
          </form>
        </div>

        {user?.role === 'superadmin' && (
          <div className="profile-admin-note">
            <div><strong>Acceso de superadministrador</strong><p>Desde este perfil puedes mantener tus datos de contacto y cerrar la sesión. La gestión del negocio está en el panel.</p></div>
            <Link to="/superadmin">Ir al panel</Link>
          </div>
        )}
        <div className="profile-logout-row">
          <span>¿Terminaste de revisar tu cuenta?</span>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}