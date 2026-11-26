import AccountNav from '../../components/layout/AccountNav';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Camera, LogOut, Save, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    fetch(`${API.users}/${user.id}`, { headers: authHeaders() })
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
        setName(data.fullName || user.name);
        setPhone(data.phone || '');
        setAddress(data.address || '');
      })
      .catch((error: Error) => {
        if (!cancelled) {
          notify.error(error.message, 'No se pudo cargar el perfil');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const response = await fetch(`${API.users}/${user.id}/profile`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fullName: name, phone, address }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudieron guardar los cambios.');
      }

      setProfile(data as ProfileData);
      setName(data.fullName);
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
            <p>Consulta y actualiza tus datos personales.</p>
          </div>

          <span className="profile-account-mark">
            <UserRound size={18} /> Cuenta protegida
          </span>
        </header>

        <div className="profile-layout">
          <aside className="profile-photo-card">
            <div className="profile-avatar" aria-label="Foto de perfil">
              {photo ? (
                <img src={photo} alt="Tu foto de perfil" />
              ) : (
                <span>{initials || <UserRound size={42} />}</span>
              )}
            </div>

            <h2>{name || 'Tu perfil'}</h2>
            <p>{profile?.email || user?.email}</p>

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

            {loading ? (
              <div className="profile-loading">Cargando tus datos…</div>
            ) : (
              <>
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

                <label className="profile-field">
                  <span>Teléfono</span>
                  <input
                    type="tel"
                    maxLength={30}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    placeholder="Añade tu teléfono"
                  />
                </label>

                <label className="profile-field">
                  <span>Dirección</span>
                  <textarea
                    maxLength={255}
                    rows={3}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    autoComplete="street-address"
                    placeholder="Añade tu dirección de entrega"
                  />
                </label>

                <div className="profile-form-footer">
                  <button
                    className="profile-save-btn"
                    type="submit"
                    disabled={saving}
                  >
                    <Save size={17} />
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

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