import { create } from 'zustand';
import { User, Shipment, Flight, Equipment, ActionLog, AutoTask, ArrivalShipment } from '@/data/mock';
import { authApi, dataApi } from '@/lib/api';

export type Section = 'dashboard' | 'planning-rail' | 'planning-auto' | 'planning-arrival' | 'flights-rail' | 'equipment' | 'requests' | 'accounts' | 'reports';

interface AppStore {
  currentUser: User | null;
  section: Section;
  shipments: Shipment[];
  flights: Flight[];
  equipment: Equipment[];
  logs: ActionLog[];
  sidebarOpen: boolean;
  darkMode: boolean;
  autoTasks: AutoTask[];
  isLoading: boolean;
  users: User[];

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  setSection: (s: Section) => void;
  setSidebarOpen: (v: boolean) => void;
  toggleDarkMode: () => void;

  loadAll: () => Promise<void>;

  updateShipment: (id: string, data: Partial<Shipment>, userId: string, userName: string) => void;
  addShipment: (s: Shipment) => void;
  deleteShipment: (id: string) => void;
  deleteManyShipments: (ids: string[]) => void;
  moveShipmentToFlight: (shipmentId: string, flightId: string, userId: string, userName: string) => void;

  addFlight: (f: Flight) => void;
  updateFlight: (id: string, data: Partial<Flight>) => void;
  departFlight: (flightId: string, userId: string, userName: string) => void;

  updateEquipment: (id: string, data: Partial<Equipment>, userId: string, userName: string) => void;
  addEquipment: (e: Equipment) => void;
  deleteEquipment: (id: string) => void;

  addAutoTask: (t: AutoTask) => void;
  updateAutoTask: (id: string, data: Partial<AutoTask>) => void;
  deleteAutoTask: (id: string) => void;
  deleteManyAutoTasks: (ids: string[]) => void;

  arrivalShipments: ArrivalShipment[];
  addArrivalShipment: (r: ArrivalShipment) => void;
  updateArrivalShipment: (id: string, data: Partial<ArrivalShipment>) => void;
  deleteManyArrivalShipments: (ids: string[]) => void;

  loadUsers: () => Promise<void>;
  createUser: (data: { name: string; email: string; password: string; role: string }) => Promise<void>;
  updateUser: (id: string, data: Partial<{ name: string; email: string; password: string; role: string; is_active: boolean }>) => Promise<void>;
}

function writeLog(userId: string, userName: string, action: string, entity: string, entityId: string) {
  dataApi.createLog({ userId, userName, action, entity, entityId }).catch(() => null);
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentUser: null,
  section: 'dashboard',
  shipments: [],
  flights: [],
  equipment: [],
  logs: [],
  autoTasks: [],
  arrivalShipments: [],
  sidebarOpen: true,
  darkMode: false,
  isLoading: false,
  users: [],

  login: async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('auth_token', res.token);
      const user: User = { ...res.user, password: '' };
      set({ currentUser: user });
      await get().loadAll();
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    authApi.logout().catch(() => null);
    localStorage.removeItem('auth_token');
    set({ currentUser: null, shipments: [], flights: [], equipment: [], logs: [], autoTasks: [] });
  },

  restoreSession: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await authApi.me();
      const user: User = { ...res.user, password: '' };
      set({ currentUser: user });
      await get().loadAll();
    } catch {
      localStorage.removeItem('auth_token');
    }
  },

  loadAll: async () => {
    set({ isLoading: true });
    try {
      const [shipmentsRes, flightsRes, equipmentRes, autoTasksRes, logsRes] = await Promise.all([
        dataApi.getShipments(),
        dataApi.getFlights(),
        dataApi.getEquipment(),
        dataApi.getAutoTasks(),
        dataApi.getLogs(),
      ]);
      set({
        shipments: shipmentsRes.shipments || [],
        flights: flightsRes.flights || [],
        equipment: equipmentRes.equipment || [],
        autoTasks: (autoTasksRes.auto_tasks || []).map((t: Record<string, unknown>) => ({
          ...t,
          krkNumber: t.krkNumber || '',
        })),
        logs: (logsRes.action_logs || []).map((l: Record<string, unknown>) => ({
          id: l.id, userId: l.userId, userName: l.userName,
          action: l.action, entity: l.entity, entityId: l.entityId,
          timestamp: l.timestamp,
        })),
      });
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setSection: (section) => set({ section }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    document.documentElement.classList.toggle('dark', next);
  },

  // ── Shipments ──────────────────────────────────────────────────────────────

  updateShipment: (id, data, userId, userName) => {
    set(s => ({
      shipments: s.shipments.map(sh => sh.id === id ? { ...sh, ...data, editedBy: userName, editedAt: new Date().toLocaleString('ru') } : sh),
    }));
    const shipment = get().shipments.find(sh => sh.id === id);
    if (shipment) {
      dataApi.updateShipment(id, { ...shipment, ...data, editedBy: userName }).catch(() => null);
    }
    writeLog(userId, userName, 'Редактирование отправки', 'Отправка', id);
  },

  addShipment: (ship) => {
    set(s => ({ shipments: [...s.shipments, ship] }));
    dataApi.createShipment(ship).then(res => {
      if (res.id && res.id !== ship.id) {
        set(s => ({ shipments: s.shipments.map(sh => sh.id === ship.id ? { ...sh, id: res.id } : sh) }));
      }
    }).catch(() => null);
  },

  deleteShipment: (id) => {
    set(s => ({ shipments: s.shipments.filter(sh => sh.id !== id) }));
    dataApi.deleteShipment(id).catch(() => null);
  },

  deleteManyShipments: (ids) => {
    set(s => ({ shipments: s.shipments.filter(sh => !ids.includes(sh.id)) }));
    ids.forEach(id => dataApi.deleteShipment(id).catch(() => null));
  },

  moveShipmentToFlight: (shipmentId, flightId, userId, userName) => {
    set(s => ({
      shipments: s.shipments.map(sh => sh.id === shipmentId ? { ...sh, flightId } : sh),
    }));
    const shipment = get().shipments.find(sh => sh.id === shipmentId);
    if (shipment) {
      dataApi.updateShipment(shipmentId, { ...shipment, flightId }).catch(() => null);
    }
    writeLog(userId, userName, `Перемещён в рейс ${flightId}`, 'Отправка', shipmentId);
  },

  // ── Flights ────────────────────────────────────────────────────────────────

  addFlight: (f) => {
    set(s => ({ flights: [...s.flights, f] }));
    dataApi.createFlight(f).then(res => {
      if (res.id && res.id !== f.id) {
        set(s => ({ flights: s.flights.map(fl => fl.id === f.id ? { ...fl, id: res.id } : fl) }));
      }
    }).catch(() => null);
  },

  updateFlight: (id, data) => {
    set(s => ({ flights: s.flights.map(f => f.id === id ? { ...f, ...data } : f) }));
    const flight = get().flights.find(f => f.id === id);
    if (flight) {
      dataApi.updateFlight(id, { ...flight, ...data }).catch(() => null);
    }
  },

  departFlight: (flightId, userId, userName) => {
    const factDate = new Date().toISOString().slice(0, 10);
    set(s => ({
      flights: s.flights.map(f => f.id === flightId ? { ...f, status: 'departed', factDate } : f),
      shipments: s.shipments.map(sh => sh.flightId === flightId ? { ...sh, status: 'in_transit' } : sh),
    }));
    const flight = get().flights.find(f => f.id === flightId);
    if (flight) {
      dataApi.updateFlight(flightId, { ...flight, status: 'departed', factDate }).catch(() => null);
    }
    writeLog(userId, userName, 'Рейс отправлен', 'Рейс', flightId);
  },

  // ── Equipment ──────────────────────────────────────────────────────────────

  updateEquipment: (id, data, userId, userName) => {
    set(s => ({
      equipment: s.equipment.map(e => e.id === id ? { ...e, ...data } : e),
    }));
    const eq = get().equipment.find(e => e.id === id);
    if (eq) {
      dataApi.updateEquipment(id, { ...eq, ...data }).catch(() => null);
    }
    writeLog(userId, userName, 'Редактирование оборудования', 'Оборудование', id);
  },

  addEquipment: (e) => {
    set(s => ({ equipment: [...s.equipment, e] }));
    dataApi.createEquipment(e).then(res => {
      if (res.id && res.id !== e.id) {
        set(s => ({ equipment: s.equipment.map(eq => eq.id === e.id ? { ...eq, id: res.id } : eq) }));
      }
    }).catch(() => null);
  },

  deleteEquipment: (id) => {
    set(s => ({ equipment: s.equipment.filter(e => e.id !== id) }));
    dataApi.deleteEquipment(id).catch(() => null);
  },

  // ── Auto Tasks ─────────────────────────────────────────────────────────────

  addAutoTask: (t) => {
    set(s => ({ autoTasks: [...s.autoTasks, t] }));
    dataApi.createAutoTask(t).then(res => {
      if (res.id && res.id !== t.id) {
        set(s => ({ autoTasks: s.autoTasks.map(at => at.id === t.id ? { ...at, id: res.id } : at) }));
      }
    }).catch(() => null);
  },

  updateAutoTask: (id, data) => {
    set(s => ({ autoTasks: s.autoTasks.map(t => t.id === id ? { ...t, ...data } : t) }));
    const task = get().autoTasks.find(t => t.id === id);
    if (task) {
      dataApi.updateAutoTask(id, { ...task, ...data }).catch(() => null);
    }
  },

  deleteAutoTask: (id) => {
    set(s => ({ autoTasks: s.autoTasks.filter(t => t.id !== id) }));
    dataApi.deleteAutoTask(id).catch(() => null);
  },

  deleteManyAutoTasks: (ids) => {
    set(s => ({ autoTasks: s.autoTasks.filter(t => !ids.includes(t.id)) }));
    ids.forEach(id => dataApi.deleteAutoTask(id).catch(() => null));
  },

  // ── Arrival Shipments ──────────────────────────────────────────────────────

  addArrivalShipment: (r) => {
    set(s => ({ arrivalShipments: [...s.arrivalShipments, r] }));
  },

  updateArrivalShipment: (id, data) => {
    set(s => ({ arrivalShipments: s.arrivalShipments.map(r => r.id === id ? { ...r, ...data } : r) }));
  },

  deleteManyArrivalShipments: (ids) => {
    set(s => ({ arrivalShipments: s.arrivalShipments.filter(r => !ids.includes(r.id)) }));
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  loadUsers: async () => {
    try {
      const res = await authApi.getUsers();
      set({ users: (res.users || []).map((u: Record<string, unknown>) => ({ ...u, password: '' })) });
    } catch {
      /* нет доступа — игнорируем */
    }
  },

  createUser: async (data) => {
    const res = await authApi.createUser(data);
    set(s => ({ users: [...s.users, { ...res, password: '' }] }));
  },

  updateUser: async (id, data) => {
    await authApi.updateUser(id, data);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, ...data } : u),
    }));
  },
}));