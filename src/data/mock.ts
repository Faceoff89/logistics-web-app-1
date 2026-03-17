export type UserRole = 'logist' | 'manager' | 'director' | 'mechanic';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export const USERS: User[] = [];

export type EquipmentStatus = 'checked' | 'unchecked' | 'broken';
export type ContainerType = 'container' | 'dgk' | 'egk' | 'ndgu';

export interface Equipment {
  id: string;
  number: string;
  type: ContainerType;
  status: EquipmentStatus;
  location: string;
  lastCheck: string;
  comment: string;
}

export const EQUIPMENT: Equipment[] = [
  { id: 'e1', number: 'TCKU3456789', type: 'container', status: 'checked', location: 'ПИК', lastCheck: '2026-02-20', comment: '' },
  { id: 'e2', number: 'CRXU7890123', type: 'container', status: 'checked', location: 'ДТК', lastCheck: '2026-02-18', comment: '' },
  { id: 'e3', number: 'MSCU4561234', type: 'container', status: 'unchecked', location: 'Гамбург', lastCheck: '2026-01-15', comment: 'Требует осмотра' },
  { id: 'e4', number: 'GESU1234567', type: 'container', status: 'broken', location: 'ПИК', lastCheck: '2026-02-10', comment: 'Неисправен термостат' },
  { id: 'e5', number: 'СVIU8901234', type: 'container', status: 'checked', location: 'ДТК', lastCheck: '2026-02-22', comment: '' },
  { id: 'e6', number: 'DGK-001', type: 'dgk', status: 'checked', location: 'ПИК', lastCheck: '2026-02-19', comment: '' },
  { id: 'e7', number: 'DGK-002', type: 'dgk', status: 'unchecked', location: 'ДТК', lastCheck: '2026-01-28', comment: '' },
  { id: 'e8', number: 'EGK-001', type: 'egk', status: 'checked', location: 'Гамбург', lastCheck: '2026-02-15', comment: '' },
  { id: 'e9', number: 'NDGU-001', type: 'ndgu', status: 'checked', location: 'ПИК', lastCheck: '2026-02-21', comment: '' },
  { id: 'e10', number: 'NDGU-002', type: 'ndgu', status: 'broken', location: 'ДТК', lastCheck: '2026-02-05', comment: 'Замена аккумулятора' },
  { id: 'e11', number: 'TCKU9876543', type: 'container', status: 'checked', location: 'ПИК', lastCheck: '2026-02-23', comment: '' },
  { id: 'e12', number: 'HLCU2345678', type: 'container', status: 'checked', location: 'ДТК', lastCheck: '2026-02-17', comment: '' },
];

export type ShipmentStatus = 'ready' | 'not_ready' | 'in_transit' | 'delayed';
export type ShipmentType = 'import' | 'rf' | 'transit';
export type Direction = 'moscow' | 'spb' | 'novosibirsk';

export type InspectionNote = 'without_connection' | 'with_connection_act';

export interface Shipment {
  id: string;
  number: string;
  request: string;
  client: string;
  containerNumber: string;
  footage: string;
  deliveryDate: string;
  docsDate: string;
  inspectionDate: string;
  places: number;
  weight: number;
  cargo: string;
  tempMode: string;
  vsdNumber: string;
  status: ShipmentStatus;
  shipmentType: ShipmentType;
  terminal: string;
  destination: string;
  gngCode: string;
  etsnvCode: string;
  requestName: string;
  comment: string;
  dtNumber: string;
  billOfLading: string;
  subsidy: string;
  flightId: string;
  inspectionNote: InspectionNote;
  vsdSender: string;
  editedBy?: string;
  editedAt?: string;
}

export type FlightStatus = 'planned' | 'ready' | 'departed' | 'arrived';

export interface Flight {
  id: string;
  number: string;
  direction: Direction;
  planDate: string;
  factDate: string;
  status: FlightStatus;
}

export const FLIGHTS: Flight[] = [
  { id: 'f1', number: 'МСК-2026-001', direction: 'moscow', planDate: '2026-03-01', factDate: '', status: 'planned' },
  { id: 'f2', number: 'СПБ-2026-001', direction: 'spb', planDate: '2026-03-05', factDate: '', status: 'ready' },
  { id: 'f3', number: 'НСК-2026-001', direction: 'novosibirsk', planDate: '2026-02-28', factDate: '2026-02-28', status: 'departed' },
  { id: 'f4', number: 'МСК-2026-002', direction: 'moscow', planDate: '2026-03-10', factDate: '', status: 'planned' },
];

export const SHIPMENTS: Shipment[] = [
  { id: 's1', number: '001', request: 'ЗЯ-2026-045', client: 'ООО Фрешпром', containerNumber: 'TCKU3456789', footage: '40HC', deliveryDate: '2026-02-20', docsDate: '2026-02-22', inspectionDate: '2026-02-23', places: 12, weight: 18500, cargo: 'Мясо птицы', tempMode: '-18', vsdNumber: 'ВСД-001234', status: 'ready', shipmentType: 'import', terminal: 'ПИК', destination: 'Москва-Товарная', gngCode: '0207', etsnvCode: '011', requestName: 'Мясо замороженное', comment: '', dtNumber: 'ДТ-2026-001', billOfLading: '', subsidy: 'Да', flightId: 'f1', inspectionNote: 'without_connection', vsdSender: '' },
  { id: 's2', number: '002', request: 'ЗЯ-2026-046', client: 'АО МолокоТрейд', containerNumber: 'CRXU7890123', footage: '20', deliveryDate: '2026-02-18', docsDate: '2026-02-23', inspectionDate: '', places: 8, weight: 12000, cargo: 'Сыр твёрдый', tempMode: '+4', vsdNumber: 'ВСД-001235', status: 'not_ready', shipmentType: 'rf', terminal: 'ДТК', destination: 'Санкт-Петербург-Тов', gngCode: '0406', etsnvCode: '014', requestName: 'Молочная продукция', comment: 'Ожидаем ВСД', dtNumber: '', billOfLading: '', subsidy: 'Нет', flightId: 'f2', inspectionNote: 'without_connection', vsdSender: '' },
  { id: 's3', number: '003', request: 'ЗЯ-2026-047', client: 'ИП Рыбников', containerNumber: 'MSCU4561234', footage: '40', deliveryDate: '2026-02-15', docsDate: '2026-02-24', inspectionDate: '2026-02-24', places: 20, weight: 22000, cargo: 'Рыба мороженная', tempMode: '-20', vsdNumber: 'ВСД-001236', status: 'in_transit', shipmentType: 'transit', terminal: 'ПИК', destination: 'Новосибирск-Вост', gngCode: '0302', etsnvCode: '012', requestName: 'Рыба замороженная', comment: '', dtNumber: 'ДТ-2026-003', billOfLading: 'КОН-001', subsidy: 'Да', flightId: 'f3', inspectionNote: 'with_connection_act', vsdSender: '' },
  { id: 's4', number: '004', request: 'ЗЯ-2026-048', client: 'ООО АгроЭкспорт', containerNumber: 'GESU1234567', footage: '40HC', deliveryDate: '2026-02-10', docsDate: '', inspectionDate: '', places: 16, weight: 19800, cargo: 'Ягода замороженная', tempMode: '-18', vsdNumber: '', status: 'delayed', shipmentType: 'import', terminal: 'ДТК', destination: 'Москва-Товарная', gngCode: '0811', etsnvCode: '018', requestName: 'Плодоовощная', comment: 'Нет документов', dtNumber: '', billOfLading: '', subsidy: 'Нет', flightId: 'f1', inspectionNote: 'without_connection', vsdSender: '' },
  { id: 's5', number: '005', request: 'ЗЯ-2026-049', client: 'ООО СибМит', containerNumber: 'СVIU8901234', footage: '40', deliveryDate: '2026-02-22', docsDate: '2026-03-01', inspectionDate: '', places: 14, weight: 16500, cargo: 'Говядина', tempMode: '-18', vsdNumber: 'ВСД-001237', status: 'not_ready', shipmentType: 'rf', terminal: 'ПИК', destination: 'Новосибирск-Вост', gngCode: '0201', etsnvCode: '011', requestName: 'Мясо крупного скота', comment: '', dtNumber: '', billOfLading: '', subsidy: 'Да', flightId: 'f4', inspectionNote: 'without_connection', vsdSender: '' },
  { id: 's6', number: '006', request: 'ЗЯ-2026-050', client: 'ООО ПродИмпорт', containerNumber: 'TCKU9876543', footage: '20', deliveryDate: '2026-02-19', docsDate: '2026-03-03', inspectionDate: '2026-03-04', places: 10, weight: 11000, cargo: 'Масло сливочное', tempMode: '+4', vsdNumber: 'ВСД-001238', status: 'ready', shipmentType: 'transit', terminal: 'ДТК', destination: 'Санкт-Петербург-Тов', gngCode: '0405', etsnvCode: '014', requestName: 'Молочный жир', comment: '', dtNumber: 'ДТ-2026-006', billOfLading: '', subsidy: 'Нет', flightId: 'f2', inspectionNote: 'without_connection', vsdSender: '' },
];

export const TERMINALS = ['ПИК', 'ДТК', 'Гамбург', 'Восточный', 'Новороссийск'];

export const STATUSES_LABEL: Record<ShipmentStatus, string> = {
  ready: 'Готов',
  not_ready: 'Не готов',
  in_transit: 'В пути',
  delayed: 'Задержан',
};

export const SHIPMENT_TYPE_LABEL: Record<ShipmentType, string> = {
  import: 'Импорт',
  rf: 'РФ',
  transit: 'Транзит',
};

export const DIRECTIONS_LABEL: Record<Direction, string> = {
  moscow: 'Москва',
  spb: 'Санкт-Петербург',
  novosibirsk: 'Новосибирск',
};

export const FLIGHT_STATUS_LABEL: Record<FlightStatus, string> = {
  planned: 'Запланирован',
  ready: 'Готов',
  departed: 'Отправлен',
  arrived: 'Прибыл',
};

export const EQUIPMENT_STATUS_LABEL: Record<EquipmentStatus, string> = {
  checked: 'Проверен',
  unchecked: 'Не проверен',
  broken: 'Неисправен',
};

export type ActionLog = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
};

// ==================== АВТО ====================

export type AutoTaskType = 'movement' | 'loading' | 'unloading';
export type AutoTaskStatus = 'planned' | 'in_progress' | 'done' | 'cancelled';

export interface AutoTask {
  id: string;
  type: AutoTaskType;
  date: string;
  containerNumber: string;
  client: string;
  carrier: string;
  time: string;
  address: string;
  contact: string;
  terminalFrom: string;
  terminalTo: string;
  cargo: string;
  tempMode: string;
  status: AutoTaskStatus;
  comment: string;
  direction?: string;
  editedBy?: string;
  editedAt?: string;
}

export const AUTO_TASK_TYPE_LABEL: Record<AutoTaskType, string> = {
  movement: 'Перемещение',
  loading: 'Погрузка',
  unloading: 'Выгрузка',
};

export const AUTO_TASK_STATUS_LABEL: Record<AutoTaskStatus, string> = {
  planned: 'Запланировано',
  in_progress: 'В процессе',
  done: 'Выполнено',
  cancelled: 'Отменено',
};

export const AUTO_TASKS: AutoTask[] = [
  { id: 'at1', type: 'movement', date: '2026-02-24', containerNumber: 'SEGU9149102', client: '', carrier: 'ГТЛ', time: '', address: '', contact: '', terminalFrom: 'ВМТП', terminalTo: 'ПИК', cargo: 'Киви', tempMode: '-18', status: 'planned', comment: '', direction: 'Шушары' },
  { id: 'at2', type: 'loading', date: '2026-02-24', containerNumber: 'AVGU7003537', client: 'ВИКИНГ ООО', carrier: 'ИП Нагель', time: '9:00', address: 'Артём, ул. 1я Рабочая, 83', contact: '8 914 07 50 545 Алеся', terminalFrom: 'с Выгрузки', terminalTo: 'ПИК', cargo: 'Куриная грудка', tempMode: '-25', status: 'planned', comment: '', direction: 'Селятино' },
  { id: 'at3', type: 'unloading', date: '2026-02-24', containerNumber: 'AVGU7003537', client: 'ДВЛОГИСТИК ООО', carrier: 'Нагель', time: '13:00', address: 'Надеждинский район, ТОР Надеждинская, ул. Центральная 20', contact: '8924 130-56-46 Михаил', terminalFrom: 'ПИК', terminalTo: 'На погрузку', cargo: '', tempMode: '', status: 'planned', comment: '' },
  { id: 'at4', type: 'unloading', date: '2026-02-24', containerNumber: 'MNBU3226593', client: 'ООО "Фар Ист Логистик"', carrier: 'самовывоз', time: '', address: '', contact: '', terminalFrom: 'ПИК', terminalTo: 'Форвард', cargo: '', tempMode: '', status: 'planned', comment: 'выдача разрешена' },
  { id: 'at5', type: 'unloading', date: '2026-02-24', containerNumber: 'TEMU9205820', client: 'ТК ВИКИНГ ООО', carrier: 'Солдис', time: '10:30', address: 'г. Артём, ул. 1-я Рабочая, д. 83', contact: '8 914 07 50 545 Алеся', terminalFrom: 'ПИК', terminalTo: 'Терминал Б', cargo: '', tempMode: '', status: 'done', comment: '' },
  { id: 'at6', type: 'movement', date: '2026-02-24', containerNumber: 'NLUU0205679', client: 'ПОРОЖНИЕ С САХАЛИНА', carrier: 'ГТЛ', time: '', address: '', contact: '', terminalFrom: 'ВМТП', terminalTo: 'ПОСЕЙДОН', cargo: '', tempMode: '', status: 'planned', comment: '' },
];

// ==================== ПЛАНИРОВАНИЕ ПРИБЫТИЕ ====================

export type ArrivalStatus = 'planned' | 'arrived' | 'unloaded' | 'issued';

export interface ArrivalShipment {
  id: string;
  railSendDate: string;
  stationFrom: string;
  container: string;
  terminalUnloadDate: string;
  vsd: string;
  tempMode: string;
  cargo: string;
  consignee: string;
  destinationCity: string;
  clientNotifyDate: string;
  inspectionDate: string;
  exportDate: string;
  exportBan: string;
  comment: string;
  unloadAddress: string;
  scep: string;
  scepDate: string;
  customer: string;
  manager: string;
  cargoWeight: string;
  cdekArrivalKey: string;
  cdekTrack: string;
  documents: string;
  status: ArrivalStatus;
  editedBy?: string;
  editedAt?: string;
}

export const ARRIVAL_STATUS_LABEL: Record<ArrivalStatus, string> = {
  planned: 'Ожидается',
  arrived: 'Прибыл',
  unloaded: 'Выгружен',
  issued: 'Выдан',
};

export const ARRIVAL_SHIPMENTS: ArrivalShipment[] = [];

export const ACTION_LOGS: ActionLog[] = [
  { id: 'l1', userId: '1', userName: 'Алексей Петров', action: 'Изменён статус', entity: 'Отправка', entityId: 's1', timestamp: '2026-02-23 09:14' },
  { id: 'l2', userId: '2', userName: 'Марина Соколова', action: 'Создан рейс', entity: 'Рейс', entityId: 'f2', timestamp: '2026-02-23 08:30' },
  { id: 'l3', userId: '1', userName: 'Алексей Петров', action: 'Обновлены документы', entity: 'Отправка', entityId: 's3', timestamp: '2026-02-22 17:45' },
  { id: 'l4', userId: '3', userName: 'Игорь Директоров', action: 'Добавлено оборудование', entity: 'Контейнер', entityId: 'e11', timestamp: '2026-02-22 16:00' },
];