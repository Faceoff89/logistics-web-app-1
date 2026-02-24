import { create } from 'zustand';
import { User, USERS, Shipment, SHIPMENTS, Flight, FLIGHTS, Equipment, EQUIPMENT, ActionLog, ACTION_LOGS, AutoTask, AUTO_TASKS } from '@/data/mock';

export type Section = 'dashboard' | 'planning-rail' | 'planning-auto' | 'flights-rail' | 'equipment' | 'requests' | 'accounts' | 'reports';

interface AppStore {
  currentUser: User | null;
  section: Section;
  shipments: Shipment[];
  flights: Flight[];
  equipment: Equipment[];
  logs: ActionLog[];
  sidebarOpen: boolean;
  darkMode: boolean;

  login: (email: string, password: string) => boolean;
  logout: () => void;
  setSection: (s: Section) => void;
  setSidebarOpen: (v: boolean) => void;
  toggleDarkMode: () => void;

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

  autoTasks: AutoTask[];
  addAutoTask: (t: AutoTask) => void;
  updateAutoTask: (id: string, data: Partial<AutoTask>) => void;
  deleteAutoTask: (id: string) => void;
  deleteManyAutoTasks: (ids: string[]) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentUser: null,
  section: 'dashboard',
  shipments: SHIPMENTS,
  flights: FLIGHTS,
  equipment: EQUIPMENT,
  logs: ACTION_LOGS,
  autoTasks: AUTO_TASKS,
  sidebarOpen: true,
  darkMode: false,

  login: (email, password) => {
    const user = USERS.find(u => u.email === email && u.password === password);
    if (user) { set({ currentUser: user }); return true; }
    return false;
  },
  logout: () => set({ currentUser: null }),
  setSection: (section) => set({ section }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    document.documentElement.classList.toggle('dark', next);
  },

  updateShipment: (id, data, userId, userName) => {
    const log: ActionLog = {
      id: `l${Date.now()}`, userId, userName,
      action: 'Редактирование отправки', entity: 'Отправка', entityId: id,
      timestamp: new Date().toLocaleString('ru'),
    };
    set(s => ({
      shipments: s.shipments.map(sh => sh.id === id ? { ...sh, ...data, editedBy: userName, editedAt: new Date().toLocaleString('ru') } : sh),
      logs: [log, ...s.logs],
    }));
  },
  addShipment: (ship) => set(s => ({ shipments: [...s.shipments, ship] })),
  deleteShipment: (id) => set(s => ({ shipments: s.shipments.filter(sh => sh.id !== id) })),
  deleteManyShipments: (ids) => set(s => ({ shipments: s.shipments.filter(sh => !ids.includes(sh.id)) })),
  moveShipmentToFlight: (shipmentId, flightId, userId, userName) => {
    const log: ActionLog = {
      id: `l${Date.now()}`, userId, userName,
      action: `Перемещён в рейс ${flightId}`, entity: 'Отправка', entityId: shipmentId,
      timestamp: new Date().toLocaleString('ru'),
    };
    set(s => ({
      shipments: s.shipments.map(sh => sh.id === shipmentId ? { ...sh, flightId } : sh),
      logs: [log, ...s.logs],
    }));
  },

  addFlight: (f) => set(s => ({ flights: [...s.flights, f] })),
  updateFlight: (id, data) => set(s => ({ flights: s.flights.map(f => f.id === id ? { ...f, ...data } : f) })),
  departFlight: (flightId, userId, userName) => {
    const log: ActionLog = {
      id: `l${Date.now()}`, userId, userName,
      action: `Рейс отправлен`, entity: 'Рейс', entityId: flightId,
      timestamp: new Date().toLocaleString('ru'),
    };
    set(s => ({
      flights: s.flights.map(f => f.id === flightId ? { ...f, status: 'departed', factDate: new Date().toISOString().slice(0, 10) } : f),
      shipments: s.shipments.map(sh => sh.flightId === flightId ? { ...sh, status: 'in_transit' } : sh),
      logs: [log, ...s.logs],
    }));
  },

  updateEquipment: (id, data, userId, userName) => {
    const log: ActionLog = {
      id: `l${Date.now()}`, userId, userName,
      action: 'Редактирование оборудования', entity: 'Оборудование', entityId: id,
      timestamp: new Date().toLocaleString('ru'),
    };
    set(s => ({
      equipment: s.equipment.map(e => e.id === id ? { ...e, ...data } : e),
      logs: [log, ...s.logs],
    }));
  },
  addEquipment: (e) => set(s => ({ equipment: [...s.equipment, e] })),
  deleteEquipment: (id) => set(s => ({ equipment: s.equipment.filter(e => e.id !== id) })),

  addAutoTask: (t) => set(s => ({ autoTasks: [...s.autoTasks, t] })),
  updateAutoTask: (id, data) => set(s => ({ autoTasks: s.autoTasks.map(t => t.id === id ? { ...t, ...data } : t) })),
  deleteAutoTask: (id) => set(s => ({ autoTasks: s.autoTasks.filter(t => t.id !== id) })),
  deleteManyAutoTasks: (ids) => set(s => ({ autoTasks: s.autoTasks.filter(t => !ids.includes(t.id)) })),
}));