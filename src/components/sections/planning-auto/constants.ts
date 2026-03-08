import { AutoTask, AutoTaskType, AutoTaskStatus } from '@/data/mock';

export const TABS: { type: AutoTaskType; label: string; icon: string; color: string }[] = [
  { type: 'movement', label: 'Перемещение', icon: 'ArrowLeftRight', color: 'bg-cyan-500' },
  { type: 'loading', label: 'Погрузка', icon: 'PackagePlus', color: 'bg-yellow-400' },
  { type: 'unloading', label: 'Выгрузка', icon: 'PackageMinus', color: 'bg-orange-400' },
];

export const STATUS_COLORS: Record<AutoTaskStatus, string> = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
};

export const ROW_COLORS: Record<AutoTaskStatus, string> = {
  planned: '',
  in_progress: 'bg-yellow-50/60 dark:bg-yellow-900/10',
  done: 'bg-green-50/60 dark:bg-green-900/10',
  cancelled: 'bg-red-50/40 dark:bg-red-900/10 opacity-60',
};

export const MOVEMENT_COLS = [
  { key: 'date', label: 'Дата перемещения', w: '120px' },
  { key: 'direction', label: 'Направление', w: '160px' },
  { key: 'containerNumber', label: 'Номер КРК', w: '140px' },
  { key: 'carrier', label: 'Перевозчик', w: '140px' },
  { key: 'terminalFrom', label: 'Терминал постановки КРК', w: '160px' },
  { key: 'terminalTo', label: 'Терминал сдачи КРК', w: '160px' },
  { key: 'cargo', label: 'Груз', w: '120px' },
  { key: 'tempMode', label: 'тС', w: '60px' },
  { key: 'status', label: 'Статус', w: '130px' },
  { key: 'comment', label: 'Комментарий', w: '180px' },
] as const;

export const LOADING_COLS = [
  { key: 'date', label: 'Дата погрузки', w: '120px' },
  { key: 'client', label: 'Клиент', w: '180px' },
  { key: 'containerNumber', label: '№ контейнера', w: '140px' },
  { key: 'carrier', label: 'Перевозчик', w: '140px' },
  { key: 'time', label: 'Время погрузки', w: '100px' },
  { key: 'address', label: 'Адрес погрузки', w: '220px' },
  { key: 'contact', label: 'Контакт на погрузке', w: '180px' },
  { key: 'terminalFrom', label: 'Терминал постановки КРК', w: '160px' },
  { key: 'terminalTo', label: 'Ст. отправления', w: '130px' },
  { key: 'direction', label: 'Ст. назначения', w: '130px' },
  { key: 'cargo', label: 'Груз', w: '120px' },
  { key: 'tempMode', label: 'тС', w: '60px' },
  { key: 'status', label: 'Статус', w: '130px' },
  { key: 'comment', label: 'Комментарий', w: '180px' },
] as const;

export const UNLOADING_COLS = [
  { key: 'date', label: 'Дата выгрузки', w: '120px' },
  { key: 'client', label: 'Клиент', w: '180px' },
  { key: 'containerNumber', label: 'Номер КРК', w: '140px' },
  { key: 'carrier', label: 'Перевозчик', w: '140px' },
  { key: 'time', label: 'Время выгрузки', w: '100px' },
  { key: 'address', label: 'Адрес выгрузки', w: '220px' },
  { key: 'contact', label: 'Контакт на выгрузке', w: '180px' },
  { key: 'terminalFrom', label: 'Терминал постановки КРК', w: '160px' },
  { key: 'terminalTo', label: 'Терминал сдачи порожнего', w: '160px' },
  { key: 'status', label: 'Статус', w: '130px' },
  { key: 'comment', label: 'Комментарий', w: '180px' },
] as const;

export type ColKey = string;

export function getColsForType(type: AutoTaskType): readonly { key: ColKey; label: string; w: string }[] {
  if (type === 'movement') return MOVEMENT_COLS;
  if (type === 'loading') return LOADING_COLS;
  return UNLOADING_COLS;
}

export const EMPTY_TASK = (type: AutoTaskType): Omit<AutoTask, 'id'> => ({
  type,
  date: new Date().toISOString().slice(0, 10),
  containerNumber: '',
  client: '',
  carrier: '',
  time: '',
  address: '',
  contact: '',
  terminalFrom: 'ПИК',
  terminalTo: '',
  cargo: '',
  tempMode: '',
  status: 'planned',
  comment: '',
  direction: '',
});
