const AUTH_URL = 'https://functions.poehali.dev/c23ce911-b353-4958-bcba-88fef29e86f2';
const DATA_URL = 'https://functions.poehali.dev/eadd2566-d258-4511-9c67-58a555fec1db';

function getToken(): string {
  return localStorage.getItem('auth_token') || '';
}

async function apiFetch(url: string, method = 'GET', body?: unknown) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Auth-Token': getToken(),
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Ошибка сервера');
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch(`${AUTH_URL}/login`, 'POST', { email, password }),

  logout: () =>
    apiFetch(`${AUTH_URL}/logout`, 'POST'),

  me: () =>
    apiFetch(`${AUTH_URL}/me`),

  getUsers: () =>
    apiFetch(`${AUTH_URL}/users`),

  createUser: (data: { name: string; email: string; password: string; role: string }) =>
    apiFetch(`${AUTH_URL}/users`, 'POST', data),

  updateUser: (id: string, data: Partial<{ name: string; email: string; password: string; role: string; is_active: boolean }>) =>
    apiFetch(`${AUTH_URL}/users/${id}`, 'PUT', data),
};

// ── Data ──────────────────────────────────────────────────────────────────────

export const dataApi = {
  // Shipments
  getShipments: () => apiFetch(`${DATA_URL}/shipments`),
  createShipment: (data: unknown) => apiFetch(`${DATA_URL}/shipments`, 'POST', data),
  updateShipment: (id: string, data: unknown) => apiFetch(`${DATA_URL}/shipments/${id}`, 'PUT', data),
  deleteShipment: (id: string) => apiFetch(`${DATA_URL}/shipments/${id}`, 'DELETE'),

  // Flights
  getFlights: () => apiFetch(`${DATA_URL}/flights`),
  createFlight: (data: unknown) => apiFetch(`${DATA_URL}/flights`, 'POST', data),
  updateFlight: (id: string, data: unknown) => apiFetch(`${DATA_URL}/flights/${id}`, 'PUT', data),

  // Equipment
  getEquipment: () => apiFetch(`${DATA_URL}/equipment`),
  createEquipment: (data: unknown) => apiFetch(`${DATA_URL}/equipment`, 'POST', data),
  updateEquipment: (id: string, data: unknown) => apiFetch(`${DATA_URL}/equipment/${id}`, 'PUT', data),
  deleteEquipment: (id: string) => apiFetch(`${DATA_URL}/equipment/${id}`, 'DELETE'),

  // Auto tasks
  getAutoTasks: () => apiFetch(`${DATA_URL}/auto_tasks`),
  createAutoTask: (data: unknown) => apiFetch(`${DATA_URL}/auto_tasks`, 'POST', data),
  updateAutoTask: (id: string, data: unknown) => apiFetch(`${DATA_URL}/auto_tasks/${id}`, 'PUT', data),
  deleteAutoTask: (id: string) => apiFetch(`${DATA_URL}/auto_tasks/${id}`, 'DELETE'),

  // Logs
  getLogs: () => apiFetch(`${DATA_URL}/action_logs`),
  createLog: (data: { userId: string; userName: string; action: string; entity: string; entityId: string }) =>
    apiFetch(`${DATA_URL}/action_logs`, 'POST', data),
};
