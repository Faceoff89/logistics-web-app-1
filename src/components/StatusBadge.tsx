import { ShipmentStatus, EquipmentStatus, FlightStatus } from '@/data/mock';
import { cn } from '@/lib/utils';

const shipmentColors: Record<ShipmentStatus, string> = {
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  not_ready: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_transit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delayed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const shipmentLabel: Record<ShipmentStatus, string> = {
  ready: 'Готов', not_ready: 'Не готов', in_transit: 'В пути', delayed: 'Задержан',
};

const equipmentColors: Record<EquipmentStatus, string> = {
  checked: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  unchecked: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  broken: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const equipmentLabel: Record<EquipmentStatus, string> = {
  checked: 'Проверен', unchecked: 'Не проверен', broken: 'Неисправен',
};

const flightColors: Record<FlightStatus, string> = {
  planned: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  departed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  arrived: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};
const flightLabel: Record<FlightStatus, string> = {
  planned: 'Запланирован', ready: 'Готов', departed: 'Отправлен', arrived: 'Прибыл',
};

export function ShipmentBadge({ status }: { status: ShipmentStatus }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', shipmentColors[status])}>{shipmentLabel[status]}</span>;
}

export function EquipmentBadge({ status }: { status: EquipmentStatus }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', equipmentColors[status])}>{equipmentLabel[status]}</span>;
}

export function FlightBadge({ status }: { status: FlightStatus }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', flightColors[status])}>{flightLabel[status]}</span>;
}