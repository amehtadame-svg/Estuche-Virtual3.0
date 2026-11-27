import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { moduleApi, date } from '../Employee/employeeApi';
import '../Employee/Employee.css';

type Person = { id: string; fullName: string; role: string };
type ThreadList = { id: string; subject: string; updatedAt: string; creator: Person; _count: { messages: number } };
type Thread = { id: string; subject: string; creator: Person; messages: { id: string; body: string; createdAt: string; sender: Person }[] };
const support = <T,>(path: string, body?: unknown) => moduleApi<T>('support', path, body);

export default function SupportPanel() {
  const { user } = useAuth();
  const employee = user?.role === 'employee';
  const [threads, setThreads] = useState<ThreadList[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setThreads(await support<ThreadList[]>('/threads')); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar ayuda.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const open = async (id: string) => {
    setBusy(true); setError(''); setMessage('');
    try { setThread(await support<Thread>(`/threads/${id}`)); setReply(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo abrir la conversación.'); }
    finally { setBusy(false); }
  };
  const create = async () => {
    setBusy(true); setError(''); setMessage('');
    try { const result = await support<Thread>('/threads', { subject, body }); setSubject(''); setBody(''); setThread(result); await load(); setMessage('Solicitud enviada a la bandeja de administración.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.'); }
    finally { setBusy(false); }
  };
  const send = async () => {
    if (!thread) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await support<Thread>(`/threads/${thread.id}/messages`, { body: reply }); setReply(''); setThread(result); await load(); setMessage('Respuesta enviada.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar la respuesta.'); }
    finally { setBusy(false); }
  };
  return <div className="support-panel">
    <p>{employee ? 'Tus solicitudes son visibles para administradores y superadministradores. Revisa aquí sus respuestas.' : 'Solicitudes internas enviadas por empleados. La conversación es compartida por administración y superadministración.'}</p>
    <button type="button" disabled={busy || loading} onClick={() => { void load(); if (thread) void open(thread.id); }}>Actualizar conversaciones</button>
    {error && <p className="emp-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}{loading && <p role="status">Cargando…</p>}
    {employee && <section className="support-new"><h3>Enviar nueva solicitud</h3><label>Asunto<input maxLength={150} value={subject} onChange={e => setSubject(e.target.value)} /></label><label>Mensaje<textarea maxLength={2000} value={body} onChange={e => setBody(e.target.value)} /></label><button type="button" disabled={busy || subject.trim().length < 3 || body.trim().length < 5} onClick={() => void create()}>Enviar solicitud</button></section>}
    <section><h3>Conversaciones</h3>{!loading && !threads.length && <p>No hay solicitudes.</p>}
      {threads.map(item => <div className="support-thread" key={item.id}><div><strong>{item.subject}</strong><small>{item.creator.fullName} · {date(item.updatedAt)} · {item._count.messages} mensajes</small></div><button type="button" disabled={busy} onClick={() => void open(item.id)}>Abrir</button></div>)}
      <small>Se muestran hasta 100 conversaciones recientes.</small>
    </section>
    {thread && <section className="support-conversation"><h3>{thread.subject}</h3><p>Solicitud de {thread.creator.fullName}</p>
      <ol>{thread.messages.map(item => <li key={item.id}><strong>{item.sender.fullName} {item.sender.role === 'employee' ? '(empleado)' : '(administración)'}</strong><small>{date(item.createdAt)}</small><p>{item.body}</p></li>)}</ol>
      <label>Responder<textarea maxLength={2000} value={reply} onChange={e => setReply(e.target.value)} /></label><button type="button" disabled={busy || reply.trim().length < 5} onClick={() => void send()}>Enviar respuesta</button>
    </section>}
  </div>;
}
