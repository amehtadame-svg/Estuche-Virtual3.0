import { shortReference, referenceText } from '../../lib/reference';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useLocation,
} from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/ui/Modal';
import {
  BASE,
  authHeaders,
} from '../../api/api';
import {
  employeeApi as api,
  money,
  date,
  labels,
} from './employeeApi';
import type {
  Product,
  Person,
  Job,
  Activity,
  Movement,
  Summary,
} from './employeeApi';
import './Employee.css';

type Draft = {
  requestKey: string;
  customer: Person | null;
  lines: {
    product: Product;
    quantity: number;
  }[];
  fulfillmentMethod: 'delivery' | 'pickup';
  address: string;
};

const blankOrder = (): Draft => ({
  requestKey: crypto.randomUUID(),
  customer: null,
  lines: [],
  fulfillmentMethod: 'pickup',
  address: '',
});

const blankMovement = () => ({
  requestKey: crypto.randomUUID(),
  productId: '',
  type: 'in' as 'in' | 'out',
  quantity: 1,
  reason: '',
});

function readDraft<T>(
  key: string,
  fallback: () => T
): T {
  try {
    const raw = sessionStorage.getItem(key);

    return raw
      ? JSON.parse(raw) as T
      : fallback();
  } catch {
    return fallback();
  }
}

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'No se pudo conectar con el servidor.';

function SearchBox<
  T extends Person | Product
>({
  resource,
  label,
  onSelect,
}: {
  resource: 'customers' | 'products';
  label: string;
  onSelect: (item: T) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (query.trim().length < 2) {
      setMessage(
        'Escribe al menos dos caracteres.'
      );
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const items = await api<T[]>(
        `/${resource}?q=${
          encodeURIComponent(query.trim())
        }`
      );

      setResults(items);

      if (!items.length) {
        setMessage('Sin resultados.');
      }
    } catch (error) {
      setResults([]);
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="emp-search">
      <label>
        {label}

        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void search();
            }
          }}
        />
      </label>

      <button
        type="button"
        disabled={busy}
        onClick={() => void search()}
      >
        {busy ? 'Buscando…' : 'Buscar'}
      </button>

      {message && (
        <p role="status">
          {message}
        </p>
      )}

      <ul>
        {results.map((item) => (
          <li key={item.id}>
            <span>
              {'name' in item
                ? `${item.name} · ${
                    money(item.price)
                  } · disponibles: ${item.stock}`
                : `${item.fullName} · ${item.email}`}
            </span>

            <button
              type="button"
              onClick={() => onSelect(item)}
            >
              Seleccionar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventList({
  items,
}: {
  items: Activity[];
}) {
  return items.length ? (
    <ol className="emp-events">
      {items.map((item) => (
        <li key={item.id}>
          <strong>
            {labels[item.action] || item.action}
          </strong>

          <small>
            {date(item.createdAt)}
            {' · '}
            {item.actor?.fullName || 'Sistema'}
          </small>

          <span>{referenceText(item.note)}</span>

          {item.orderId && (
            <code>{shortReference(item.orderId)}</code>
          )}
        </li>
      ))}
    </ol>
  ) : (
    <p>No hay actividad registrada.</p>
  );
}

export default function EmployeeWorkspace() {
  const { user } = useAuth();
  const location = useLocation();

  const tab =
    location.pathname.split('/')[2] || 'inicio';

  const supervisor =
    user?.role === 'admin' ||
    user?.role === 'superadmin';

  const orderKey =
    `employee-order-${user?.id}`;

  const movementKey =
    `employee-movement-${user?.id}`;

  const [draft, setDraft] = useState<Draft>(
    () => readDraft(orderKey, blankOrder)
  );

  const [movement, setMovement] = useState(
    () => readDraft(movementKey, blankMovement)
  );

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);

  const [activity, setActivity] =
    useState<Activity[]>([]);

  const [movements, setMovements] =
    useState<Movement[]>([]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [detail, setDetail] =
    useState<Job | null>(null);

  const [picked, setPicked] = useState<
    Record<string, number>
  >({});

  const [note, setNote] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [drivers, setDrivers] = useState<Person[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [recipient, setRecipient] = useState('');
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(
    () => setRevision((value) => value + 1),
    []
  );

  useEffect(() => {
    sessionStorage.setItem(
      orderKey,
      JSON.stringify(draft)
    );
  }, [draft, orderKey]);

  useEffect(() => {
    sessionStorage.setItem(
      movementKey,
      JSON.stringify(movement)
    );
  }, [movement, movementKey]);

  useEffect(() => {
    setPage(1);
    setSelectedId(null);
    setDetail(null);
    setError('');
    setMessage('');
  }, [tab]);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');

    const load = async () => {
      try {
        const overview = await api<Summary>(
          '/summary',
          undefined,
          'GET',
          controller.signal
        );

        setSummary(overview);

        if (
          ['cola', 'pedidos', 'supervision'].includes(tab)
        ) {
          const scope =
            tab === 'cola'
              ? 'available'
              : tab === 'supervision'
                ? 'supervision'
                : 'mine';

          const result = await api<{
            items: Job[];
            total: number;
          }>(
            `/orders?scope=${scope}&page=${page}`,
            undefined,
            'GET',
            controller.signal
          );

          setJobs(result.items);
          setTotal(result.total);
        }

        if (tab === 'actividad') {
          setActivity(
            await api<Activity[]>(
              `/activity?page=${page}`,
              undefined,
              'GET',
              controller.signal
            )
          );
        }

        if (tab === 'inventario') {
          setMovements(
            await api<Movement[]>(
              `/movements?page=${page}`,
              undefined,
              'GET',
              controller.signal
            )
          );
        }
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(errorMessage(reason));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [tab, page, revision]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const controller = new AbortController();

    setDetail(null);
    setNote('');
    setPickupCode('');
    setRecipient('');

    const load = async () => {
      try {
        const job = await api<Job>(
          `/orders/${selectedId}`,
          undefined,
          'GET',
          controller.signal
        );

        setDetail(job);

        setPicked(
          Object.fromEntries(
            (job.details || []).map(
              (line) => [
                line.id,
                line.pickedQuantity,
              ]
            )
          )
        );

        setDrivers(
          await api<Person[]>(
            '/drivers',
            undefined,
            'GET',
            controller.signal
          )
        );

        if (supervisor) {
          setPeople(
            await api<Person[]>(
              '/employees',
              undefined,
              'GET',
              controller.signal
            )
          );
        }
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(errorMessage(reason));
          setSelectedId(null);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [selectedId, revision, supervisor]);

  const perform = async (
    operation: () => Promise<{
      message?: string;
    }>,
    after?: () => void
  ) => {
    if (busy) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const result = await operation();

      setMessage(
        result.message || 'Operación completada.'
      );

      after?.();
      refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const action = (
    suffix: string,
    body: unknown = {},
    method = 'POST'
  ) => {
    if (selectedId) {
      void perform(
        () =>
          api(
            `/orders/${selectedId}/${suffix}`,
            body,
            method
          )
      );
    }
  };

  const createOrder = () =>
    void perform(async () => {
      if (
        !draft.customer ||
        !draft.lines.length
      ) {
        throw new Error(
          'Selecciona un cliente y al menos un producto.'
        );
      }

      const result = await api<Job>(
        '/orders',
        {
          requestKey: draft.requestKey,
          customerId: draft.customer.id,
          fulfillmentMethod:
            draft.fulfillmentMethod,
          ...(
            draft.fulfillmentMethod === 'delivery'
              ? {
                  address: draft.address,
                }
              : {}
          ),
          details: draft.lines.map(
            (line) => ({
              productId: line.product.id,
              quantity: line.quantity,
            })
          ),
        }
      );

      setDraft(blankOrder());
      setSelectedId(result.id);

      return {
        message:
          `Pedido ${shortReference(result.id)} y recibo registrados. Pendiente de pago; aún no entra en la cola.`,
      };
    });

  const addProduct = (product: Product) =>
    setDraft((current) => ({
      ...current,
      lines: current.lines.some(
        (line) =>
          line.product.id === product.id
      )
        ? current.lines.map(
            (line) =>
              line.product.id === product.id
                ? {
                    ...line,
                    quantity: line.quantity + 1,
                  }
                : line
          )
        : [
            ...current.lines,
            {
              product,
              quantity: 1,
            },
          ],
    }));

  const tabs = [
    ['inicio', 'Resumen'],
    ['nuevo', 'Crear pedido'],
    ['cola', 'Cola pagada'],
    ['pedidos', 'Mis pedidos'],
    ['inventario', 'Inventario'],
    ['actividad', 'Mi actividad'],
    ...(
      supervisor
        ? [['supervision', 'Supervisión']]
        : []
    ),
  ];

  const pagination = (
    <div className="emp-pagination">
      <button
        disabled={page <= 1 || loading}
        onClick={() =>
          setPage((current) => current - 1)
        }
      >
        Anterior
      </button>

      <span>Página {page}</span>

      <button
        disabled={
          loading ||
          (
            ['cola', 'pedidos', 'supervision'].includes(tab)
              ? page * 20 >= total
              : (
                  tab === 'actividad'
                    ? activity.length
                    : movements.length
                ) < 20
          )
        }
        onClick={() =>
          setPage((current) => current + 1)
        }
      >
        Siguiente
      </button>
    </div>
  );

  return (
    <main className="emp-shell">
      <header className="emp-heading">
        <div>
          <span className="emp-eyebrow">
            ESTUCHE · OPERACIONES
          </span>

          <h1>
            {supervisor
              ? 'Supervisión de empleados'
              : 'Mi espacio de trabajo'}
          </h1>

          <p>
            {user?.name}
            {' · '}
            ventas, preparación e inventario
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={busy || loading}
        >
          Actualizar
        </button>
      </header>

      <nav
        className="emp-tabs"
        aria-label="Módulo de empleado"
      >
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            aria-current={
              tab === key ? 'page' : undefined
            }
            to={
              key === 'inicio'
                ? '/empleado'
                : `/empleado/${key}`
            }
          >
            {label}
          </Link>
        ))}
      </nav>

      {error && (
        <div
          className="emp-alert emp-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="emp-alert"
          role="status"
        >
          {message}
        </div>
      )}

      {summary?.paymentSimulation && (
        <p className="emp-warning">
          Entorno de pruebas: la simulación de pago
          está habilitada solo para SuperAdmin.
          No genera cobros reales.
        </p>
      )}

      {loading && (
        <p role="status">
          Actualizando información…
        </p>
      )}

      {tab === 'inicio' && summary && (
        <>
          <section className="emp-cards">
            {[
              [
                'Disponibles pagados',
                summary.available,
              ],
              [
                'En preparación',
                summary.picking,
              ],
              [
                'Empacados',
                summary.packed,
              ],
              [
                'Con incidencias',
                summary.blocked,
              ],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>

          <div className="emp-columns">
            <section className="emp-panel">
              <h2>Existencias bajas</h2>

              {summary.lowStock.length
                ? summary.lowStock.map(
                    (product) => (
                      <p key={product.id}>
                        {product.name}
                        {': '}
                        <strong>
                          {product.stock}
                        </strong>
                        {' disponibles · mínimo '}
                        {product.stockMin}
                      </p>
                    )
                  )
                : (
                    <p>
                      Sin alertas de existencias.
                    </p>
                  )}
            </section>

            <section className="emp-panel">
              <h2>Actividad reciente</h2>

              <EventList
                items={summary.recent}
              />
            </section>
          </div>
        </>
      )}

      {tab === 'nuevo' && (
        <section className="emp-panel">
          <h2>Nuevo pedido para un cliente</h2>

          <p>
            Solo productos individuales.
            Los precios definitivos se consultan
            en el servidor. La reserva vence
            si no se paga.
          </p>

          <fieldset disabled={busy}>
            <SearchBox<Person>
              resource="customers"
              label="Buscar cliente registrado"
              onSelect={(customer) =>
                setDraft((current) => ({
                  ...current,
                  customer,
                  address: customer.address || '',
                }))
              }
            />

            {draft.customer && (
              <p className="emp-selected">
                Cliente:{' '}
                <strong>
                  {draft.customer.fullName}
                </strong>
                {' · '}
                {draft.customer.email}
              </p>
            )}

            <SearchBox<Product>
              resource="products"
              label="Buscar producto por nombre o SKU"
              onSelect={addProduct}
            />

            <div className="emp-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio orientativo</th>
                    <th>Cantidad</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {draft.lines.map((line) => (
                    <tr key={line.product.id}>
                      <td>
                        {line.product.name}
                      </td>

                      <td>
                        {money(line.product.price)}
                      </td>

                      <td>
                        <input
                          aria-label={
                            `Cantidad de ${line.product.name}`
                          }
                          type="number"
                          min="1"
                          max="100000"
                          value={line.quantity}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              lines: current.lines.map(
                                (item) =>
                                  item.product.id ===
                                  line.product.id
                                    ? {
                                        ...item,
                                        quantity: Number(
                                          event.target.value
                                        ),
                                      }
                                    : item
                              ),
                            }))
                          }
                        />
                      </td>

                      <td>
                        <button
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              lines: current.lines.filter(
                                (item) =>
                                  item.product.id !==
                                  line.product.id
                              ),
                            }))
                          }
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              Total orientativo:{' '}
              <strong>
                {money(
                  draft.lines.reduce(
                    (sum, line) =>
                      sum +
                      Number(line.product.price) *
                        line.quantity,
                    0
                  )
                )}
              </strong>
            </p>

            <label>
              Modalidad

              <select
                value={draft.fulfillmentMethod}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fulfillmentMethod:
                      event.target.value as
                        Draft['fulfillmentMethod'],
                  }))
                }
              >
                <option value="pickup">
                  Retiro en tienda
                </option>

                <option value="delivery">
                  Domicilio
                </option>
              </select>
            </label>

            {draft.fulfillmentMethod === 'delivery' && (
              <label>
                Dirección que quedará guardada
                en el pedido

                <textarea
                  maxLength={500}
                  value={draft.address}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </label>
            )}

            <button
              className="emp-primary"
              disabled={
                !draft.customer ||
                !draft.lines.length
              }
              onClick={createOrder}
            >
              Registrar pedido pendiente
            </button>
          </fieldset>

          <small>
            La referencia del borrador se conserva
            en esta pestaña para reintentar sin
            duplicar el pedido. Si hay un error
            ambiguo, verifica «Mis pedidos» antes
            de iniciar otra compra.
          </small>
        </section>
      )}

      {['cola', 'pedidos', 'supervision'].includes(tab) && (
        <section className="emp-panel">
          <h2>
            {tab === 'cola'
              ? 'Pedidos pagados disponibles'
              : tab === 'supervision'
                ? 'Pedidos del equipo'
                : 'Pedidos creados o asignados a mí'}
          </h2>

          <p>
            {total} registros.{' '}
            {tab === 'cola' &&
              'Los datos del cliente se muestran después de tomar el pedido.'}
          </p>

          <div className="emp-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Modalidad</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <code>
                        {shortReference(job.id)}
                      </code>

                      <small>
                        {date(job.orderDate)}
                      </small>

                      {job.customer?.fullName}
                    </td>

                    <td>
                      {labels[job.fulfillmentMethod]}
                    </td>

                    <td>
                      {money(job.total)}
                    </td>

                    <td>
                      {
                        labels[
                          job.work?.status ||
                          job.status ||
                          'paid'
                        ] || job.status
                      }
                    </td>

                    <td>
                      {tab === 'cola' ? (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void perform(
                              () =>
                                api(
                                  `/orders/${job.id}/claim`,
                                  {}
                                ),
                              () =>
                                setSelectedId(job.id)
                            )
                          }
                        >
                          Tomar pedido
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setSelectedId(job.id)
                          }
                        >
                          Ver detalle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!jobs.length && !loading && (
            <p>
              No hay pedidos en esta vista.
            </p>
          )}

          {pagination}
        </section>
      )}

      {tab === 'inventario' && (
        <>
          <section className="emp-panel">
            <h2>Registrar movimiento</h2>

            <p>
              Solo mercancía disponible.
              No registres aquí la venta ni el daño
              de unidades ya reservadas en un pedido:
              reporta una incidencia.
            </p>

            <fieldset disabled={busy}>
              <SearchBox<Product>
                resource="products"
                label="Buscar producto"
                onSelect={(product) => {
                  setSelectedProduct(product);

                  setMovement((current) => ({
                    ...current,
                    productId: product.id,
                  }));
                }}
              />

              {selectedProduct && (
                <p>
                  Seleccionado:{' '}
                  <strong>
                    {selectedProduct.name}
                  </strong>
                  {' · disponibles al consultar: '}
                  {selectedProduct.stock}
                </p>
              )}

              <label>
                Tipo

                <select
                  value={movement.type}
                  onChange={(event) =>
                    setMovement((current) => ({
                      ...current,
                      type: event.target.value as
                        'in' | 'out',
                    }))
                  }
                >
                  <option value="in">
                    Entrada
                  </option>

                  <option value="out">
                    Salida manual
                  </option>
                </select>
              </label>

              <label>
                Cantidad

                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={movement.quantity}
                  onChange={(event) =>
                    setMovement((current) => ({
                      ...current,
                      quantity: Number(
                        event.target.value
                      ),
                    }))
                  }
                />
              </label>

              <label>
                Motivo y justificación

                <textarea
                  minLength={5}
                  maxLength={400}
                  value={movement.reason}
                  onChange={(event) =>
                    setMovement((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                />
              </label>

              <button
                className="emp-primary"
                disabled={
                  !movement.productId ||
                  movement.reason.trim().length < 5
                }
                onClick={() =>
                  void perform(
                    () =>
                      api('/inventory', movement),
                    () => {
                      setMovement(blankMovement());
                      setSelectedProduct(null);
                    }
                  )
                }
              >
                Registrar movimiento
              </button>
            </fieldset>
          </section>

          <section className="emp-panel">
            <h2>
              {supervisor
                ? 'Movimientos del equipo'
                : 'Mis movimientos'}
            </h2>

            <div className="emp-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                    <th>Responsable</th>
                  </tr>
                </thead>

                <tbody>
                  {movements.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {date(item.date)}
                      </td>

                      <td>
                        {item.product.name}
                      </td>

                      <td>
                        {item.type === 'in'
                          ? 'Entrada'
                          : 'Salida'}
                      </td>

                      <td>
                        {item.quantity}
                      </td>

                      <td>
                        {referenceText(item.reason)}
                      </td>

                      <td>
                        {item.user?.fullName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination}
          </section>
        </>
      )}

      {tab === 'actividad' && (
        <section className="emp-panel">
          <h2>
            {supervisor
              ? 'Actividad del equipo'
              : 'Mi actividad'}
          </h2>

          <EventList items={activity} />
          {pagination}
        </section>
      )}

      {selectedId && (
        <Modal
          titulo={
            `Pedido ${shortReference(selectedId)}`
          }
          onClose={() => {
            if (!busy) {
              setSelectedId(null);
            }
          }}
        >
          {!detail ? (
            <p>Cargando detalle…</p>
          ) : (
            <div className="emp-detail">
              <p>
                <strong>
                  {detail.customer?.fullName}
                </strong>
                {' · '}
                {detail.customer?.phone}
                {' · '}
                {detail.customer?.email}
              </p>

              <p>
                {labels[detail.fulfillmentMethod]}
                {' · '}
                {money(detail.total)}
                {' · '}
                {labels[detail.status || 'pending']}
              </p>

              {detail.deliverySnapshot && (
                <p>
                  Dirección:{' '}
                  {detail.deliverySnapshot}
                </p>
              )}

              <p>
                Responsable:{' '}
                {
                  detail.work?.assignee.fullName ||
                  'Sin asignar'
                }
                {' · '}
                {labels[detail.work?.status || '']}
              </p>

              {detail.expiresAt && (
                <p>
                  Reserva hasta:{' '}
                  {date(detail.expiresAt)}
                </p>
              )}

              {detail.work?.incident && (
                <p className="emp-warning">
                  Incidencia:{' '}
                  {detail.work.incident}
                </p>
              )}

              <fieldset disabled={busy}>
                <div className="emp-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Solicitado</th>
                        <th>Recogido</th>
                      </tr>
                    </thead>

                    <tbody>
                      {detail.details?.map((line) => (
                        <tr key={line.id}>
                          <td>
                            {line.product.name}
                          </td>

                          <td>
                            {line.quantity}
                          </td>

                          <td>
                            <input
                              aria-label={
                                `Recogido de ${line.product.name}`
                              }
                              type="number"
                              min="0"
                              max={line.quantity}
                              disabled={
                                detail.work?.status !==
                                'picking'
                              }
                              value={
                                picked[line.id] ?? 0
                              }
                              onChange={(event) =>
                                setPicked((current) => ({
                                  ...current,
                                  [line.id]: Number(
                                    event.target.value
                                  ),
                                }))
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {detail.work?.status === 'picking' && (
                  <div className="emp-actions">
                    <button
                      onClick={() =>
                        action(
                          'picking',
                          {
                            items: Object.entries(
                              picked
                            ).map(
                              ([
                                detailId,
                                pickedQuantity,
                              ]) => ({
                                detailId,
                                pickedQuantity,
                              })
                            ),
                          },
                          'PATCH'
                        )
                      }
                    >
                      Guardar recogida
                    </button>

                    <button
                      onClick={() => action('pack')}
                    >
                      Marcar empacado
                    </button>
                  </div>
                )}

                {[
                  'picking',
                  'packed',
                  'blocked',
                ].includes(
                  detail.work?.status || ''
                ) && (
                  <>
                    <label>
                      Observación / motivo

                      <textarea
                        maxLength={500}
                        value={note}
                        onChange={(event) =>
                          setNote(event.target.value)
                        }
                      />
                    </label>

                    <div className="emp-actions">
                      <button
                        disabled={
                          note.trim().length < 5
                        }
                        onClick={() =>
                          action(
                            'incident',
                            { note }
                          )
                        }
                      >
                        Reportar incidencia
                      </button>

                      {supervisor &&
                        detail.work?.status ===
                          'blocked' && (
                          <button
                            disabled={
                              note.trim().length < 5
                            }
                            onClick={() =>
                              action(
                                'resolve',
                                { note }
                              )
                            }
                          >
                            Resolver y volver
                            a preparación
                          </button>
                        )}
                    </div>

                    {supervisor && (
                      <>
                        <label>
                          Reasignar a empleado

                          <select
                            value={assigneeId}
                            onChange={(event) =>
                              setAssigneeId(
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Seleccionar
                            </option>

                            {people.map((person) => (
                              <option
                                key={person.id}
                                value={person.id}
                              >
                                {person.fullName}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          disabled={
                            !assigneeId ||
                            note.trim().length < 5
                          }
                          onClick={() =>
                            action(
                              'reassign',
                              {
                                assigneeId,
                                note,
                              }
                            )
                          }
                        >
                          Reasignar con motivo
                        </button>
                      </>
                    )}
                  </>
                )}

                {detail.work?.status === 'packed' &&
                  detail.fulfillmentMethod ===
                    'delivery' && (
                    <>
                      <label>
                        Repartidor

                        <select
                          value={driverId}
                          onChange={(event) =>
                            setDriverId(
                              event.target.value
                            )
                          }
                        >
                          <option value="">
                            Seleccionar
                          </option>

                          {drivers.map((person) => (
                            <option
                              key={person.id}
                              value={person.id}
                            >
                              {person.fullName}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        disabled={!driverId}
                        onClick={() =>
                          action(
                            'dispatch',
                            { driverId }
                          )
                        }
                      >
                        Registrar entrega
                        al repartidor
                      </button>
                    </>
                  )}

                {detail.work?.status === 'packed' &&
                  detail.fulfillmentMethod ===
                    'pickup' && (
                    <>
                      <p>
                        El comprador genera su código
                        en «Mis retiros», dentro
                        de su cuenta.
                      </p>

                      <label>
                        Código de retiro

                        <input
                          autoComplete="off"
                          maxLength={16}
                          value={pickupCode}
                          onChange={(event) =>
                            setPickupCode(
                              event.target.value
                                .trim()
                                .toUpperCase()
                            )
                          }
                        />
                      </label>

                      <label>
                        Nombre de quien recibe

                        <input
                          maxLength={150}
                          value={recipient}
                          onChange={(event) =>
                            setRecipient(
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <button
                        disabled={
                          pickupCode.length !== 16 ||
                          recipient.trim().length < 3
                        }
                        onClick={() =>
                          action(
                            'pickup',
                            {
                              code: pickupCode,
                              recipientName:
                                recipient,
                            }
                          )
                        }
                      >
                        Confirmar entrega en tienda
                      </button>
                    </>
                  )}

                {supervisor &&
                  detail.status === 'pending' && (
                    <>
                      <label>
                        Motivo de cancelación

                        <textarea
                          maxLength={500}
                          value={note}
                          onChange={(event) =>
                            setNote(
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <button
                        disabled={
                          note.trim().length < 5
                        }
                        onClick={() =>
                          action(
                            'cancel',
                            { note }
                          )
                        }
                      >
                        Cancelar y liberar reserva
                      </button>
                    </>
                  )}

                {summary?.paymentSimulation &&
                  detail.status === 'pending' && (
                    <div className="emp-warning">
                      <strong>
                        Simulación exclusiva
                        de desarrollo
                      </strong>

                      <div className="emp-actions">
                        <button
                          onClick={() =>
                            action(
                              'simulate-payment',
                              {
                                requestKey:
                                  crypto.randomUUID(),
                                result: 'approved',
                              }
                            )
                          }
                        >
                          Simular aprobado
                        </button>

                        <button
                          onClick={() =>
                            action(
                              'simulate-payment',
                              {
                                requestKey:
                                  crypto.randomUUID(),
                                result: 'rejected',
                              }
                            )
                          }
                        >
                          Simular rechazado
                        </button>
                      </div>
                    </div>
                  )}

                {supervisor &&
                  detail.status === 'shipped' &&
                  detail.shipments?.map(
                    (shipment) => (
                      <button
                        key={shipment.id}
                        onClick={() =>
                          void perform(async () => {
                            const response =
                              await fetch(
                                `${BASE}/api/despatches/${shipment.id}`,
                                {
                                  method: 'PUT',
                                  headers:
                                    authHeaders(),
                                  body:
                                    JSON.stringify({
                                      status:
                                        'delivered',
                                    }),
                                }
                              );

                            const result =
                              await response.json();

                            if (!response.ok) {
                              throw new Error(
                                result.message ||
                                'No se pudo confirmar entrega.'
                              );
                            }

                            return {
                              message:
                                'Entrega al cliente confirmada.',
                            };
                          })
                        }
                      >
                        Confirmar entrega final
                        del envío{' '}
                        {shortReference(shipment.id)}
                      </button>
                    )
                  )}
              </fieldset>

              <h3>Historial</h3>

              <EventList
                items={detail.events || []}
              />

              {error && (
                <p
                  role="alert"
                  className="emp-error"
                >
                  {error}
                </p>
              )}

              {message && (
                <p role="status">
                  {message}
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}