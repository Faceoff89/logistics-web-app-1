import { useState, useRef } from 'react';
import { Shipment, ShipmentStatus, ShipmentType, InspectionNote, TERMINALS, STATUSES_LABEL, SHIPMENT_TYPE_LABEL } from '@/data/mock';
import { ShipmentBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

export const STATUS_ROW_COLORS: Record<ShipmentStatus, string> = {
  ready: 'bg-emerald-50/60 dark:bg-emerald-950/20',
  not_ready: 'bg-amber-50/60 dark:bg-amber-950/20',
  in_transit: 'bg-blue-50/60 dark:bg-blue-950/20',
  delayed: 'bg-red-50/70 dark:bg-red-950/25',
};

export const INSPECTION_NOTE_LABEL: Record<InspectionNote, string> = {
  without_connection: 'Без подключения',
  with_connection_act: 'С подключением есть акт',
};

export const COLS: { key: keyof Shipment; label: string; width: string }[] = [
  { key: 'number',         label: '№',                     width: 'w-10' },
  { key: 'containerNumber',label: 'Контейнер',             width: 'w-32' },
  { key: 'status',         label: 'Статус',                width: 'w-28' },
  { key: 'request',        label: 'Заявка',                width: 'w-28' },
  { key: 'client',         label: 'Клиент',                width: 'w-36' },
  { key: 'footage',        label: 'Футы',                  width: 'w-14' },
  { key: 'deliveryDate',   label: 'Завоз',                 width: 'w-24' },
  { key: 'docsDate',       label: 'Документы',             width: 'w-24' },
  { key: 'cargo',          label: 'Груз',                  width: 'w-36' },
  { key: 'tempMode',       label: 'Т°',                    width: 'w-12' },
  { key: 'weight',         label: 'Вес, кг',               width: 'w-20' },
  { key: 'shipmentType',   label: 'Тип',                   width: 'w-20' },
  { key: 'terminal',       label: 'Терминал',              width: 'w-24' },
  { key: 'destination',    label: 'Станция',               width: 'w-36' },
  { key: 'vsdSender',      label: 'Отправитель по ВСД',   width: 'w-36' },
  { key: 'inspectionNote', label: 'Примечание для досмотра', width: 'w-40' },
  { key: 'comment',        label: 'Комментарий',           width: 'w-36' },
];

export function calcDaysOnTerminal(deliveryDate: string): number | null {
  if (!deliveryDate) return null;
  const d = new Date(deliveryDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / 86400000);
}

export function EditableCell({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  if (editing) {
    return (
      <input
        ref={ref}
        autoFocus
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onChange(val); setEditing(false); }}
        onKeyDown={e => { if (e.key === 'Enter') { onChange(val); setEditing(false); } if (e.key === 'Escape') { setVal(value); setEditing(false); } }}
        className="w-full bg-transparent border-b border-primary outline-none text-xs py-0.5 text-foreground"
      />
    );
  }
  return (
    <span
      onClick={() => { setEditing(true); setVal(value); }}
      className="block cursor-text hover:text-primary transition-colors truncate max-w-full"
      title={value}
    >
      {value || <span className="text-muted-foreground/40">—</span>}
    </span>
  );
}

export function StatusCell({ value, onChange }: { value: ShipmentStatus; onChange: (v: ShipmentStatus) => void }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <select
        autoFocus
        value={value}
        onChange={e => { onChange(e.target.value as ShipmentStatus); setOpen(false); }}
        onBlur={() => setOpen(false)}
        className="text-xs bg-card border border-border rounded px-1 py-0.5 outline-none text-foreground"
      >
        {Object.entries(STATUSES_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    );
  }
  return <span onClick={() => setOpen(true)} className="cursor-pointer"><ShipmentBadge status={value} /></span>;
}

export function ShipmentTypeCell({ value, onChange }: { value: ShipmentType; onChange: (v: ShipmentType) => void }) {
  const colors: Record<ShipmentType, string> = {
    import: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    rf: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    transit: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <select
        autoFocus
        value={value}
        onChange={e => { onChange(e.target.value as ShipmentType); setOpen(false); }}
        onBlur={() => setOpen(false)}
        className="text-xs bg-card border border-border rounded px-1 py-0.5 outline-none text-foreground"
      >
        {Object.entries(SHIPMENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    );
  }
  return (
    <span
      onClick={() => setOpen(true)}
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer', colors[value])}
    >
      {SHIPMENT_TYPE_LABEL[value]}
    </span>
  );
}

export function TerminalCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs bg-transparent outline-none cursor-pointer text-foreground w-full"
    >
      {TERMINALS.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}

export function InspectionNoteCell({ value, onChange }: { value: InspectionNote; onChange: (v: InspectionNote) => void }) {
  return (
    <select
      value={value || 'without_connection'}
      onChange={e => onChange(e.target.value as InspectionNote)}
      className="text-xs bg-transparent outline-none cursor-pointer text-foreground w-full"
    >
      <option value="without_connection">Без подключения</option>
      <option value="with_connection_act">С подключением есть акт</option>
    </select>
  );
}
