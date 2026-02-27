const AUTH_URL = 'https://functions.poehali.dev/c23ce911-b353-4958-bcba-88fef29e86f2';
const DATA_URL = 'https://functions.poehali.dev/eadd2566-d258-4511-9c67-58a555fec1db';

function getToken(): string {
  return localStorage.getItem('auth_token') || '';
}

async function authFetch(payload: Record<string, unknown>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(AUTH_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Ошибка сервера');
  return data;
}

async function dataFetch(payload: Record<string, unknown>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(DATA_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Ошибка сервера');
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    authFetch({ action: 'login', email, password }),

  logout: () =>
    authFetch({ action: 'logout' }),

  me: () =>
    authFetch({ action: 'me' }),

  getUsers: () =>
    authFetch({ action: 'get_users' }),

  createUser: (data: { name: string; email: string; password: string; role: string }) =>
    authFetch({ action: 'create_user', ...data }),

  updateUser: (id: string, data: Partial<{ name: string; email: string; password: string; role: string; is_active: boolean }>) =>
    authFetch({ action: 'update_user', id, ...data }),
};

// ── Data ──────────────────────────────────────────────────────────────────────

export const dataApi = {
  getShipments: () => dataFetch({ action: 'get_shipments' }),
  createShipment: (data: unknown) => dataFetch({ action: 'create_shipment', ...(data as object) }),
  updateShipment: (id: string, data: unknown) => dataFetch({ action: 'update_shipment', id, ...(data as object) }),
  deleteShipment: (id: string) => dataFetch({ action: 'delete_shipment', id }),

  getFlights: () => dataFetch({ action: 'get_flights' }),
  createFlight: (data: unknown) => dataFetch({ action: 'create_flight', ...(data as object) }),
  updateFlight: (id: string, data: unknown) => dataFetch({ action: 'update_flight', id, ...(data as object) }),

  getEquipment: () => dataFetch({ action: 'get_equipment' }),
  createEquipment: (data: unknown) => dataFetch({ action: 'create_equipment', ...(data as object) }),
  updateEquipment: (id: string, data: unknown) => dataFetch({ action: 'update_equipment', id, ...(data as object) }),
  deleteEquipment: (id: string) => dataFetch({ action: 'delete_equipment', id }),

  getAutoTasks: () => dataFetch({ action: 'get_auto_tasks' }),
  createAutoTask: (data: unknown) => dataFetch({ action: 'create_auto_task', ...(data as object) }),
  updateAutoTask: (id: string, data: unknown) => dataFetch({ action: 'update_auto_task', id, ...(data as object) }),
  deleteAutoTask: (id: string) => dataFetch({ action: 'delete_auto_task', id }),

  getLogs: () => dataFetch({ action: 'get_action_logs' }),
  createLog: (data: { userId: string; userName: string; action: string; entity: string; entityId: string }) =>
    dataFetch({ action: 'create_action_log', ...data }),
};

// ── Database Directory ────────────────────────────────────────────────────────

const DIR_KEYS = ['clients', 'contractors', 'containers', 'vehicles', 'vessels', 'wagons', 'dgk', 'egk', 'ndgu', 'stations', 'terminals', 'cargo', 'cities'] as const;
export type DirKey = typeof DIR_KEYS[number];

export const dbApi = {
  get: (key: DirKey) => dataFetch({ action: `db_get_${key}` }),
  create: (key: DirKey, data: Record<string, string>) => dataFetch({ action: `db_create_${key}`, ...data }),
  update: (key: DirKey, id: string, data: Record<string, string>) => dataFetch({ action: `db_update_${key}`, id, ...data }),
  delete: (key: DirKey, id: string) => dataFetch({ action: `db_delete_${key}`, id }),
};