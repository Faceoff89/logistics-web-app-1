import { useState, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { Shipment, ShipmentStatus, ShipmentType, TERMINALS, STATUSES_LABEL, SHIPMENT_TYPE_LABEL } from '@/data/mock';
import { ShipmentBadge } from '@/components/StatusBadge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_ROW_COLORS: Record<ShipmentStatus, string> = {
  ready: 'bg-emerald-50/60 dark:bg-emerald-950/20',
  not_ready: 'bg-amber-50/60 dark:bg-amber-950/20',
  in_transit: 'bg-blue-50/60 dark:bg-blue-950/20',
  delayed: 'bg-red-50/70 dark:bg-red-950/25',
};

const COLS: { key: keyof Shipment; label: string; width: string }[] = [
  { key: 'number', label: '№', width: 'w-12' },
  { key: 'request', label: 'Заявка', width: 'w-32' },
  { key: 'client', label: 'Клиент', width: 'w-40' },
  { key: 'containerNumber', label: 'Контейнер', width: 'w-36' },
  { key: 'footage', label: 'Футы', width: 'w-16' },
  { key: 'deliveryDate', label: 'Дата завоза', width: 'w-28' },
  { key: 'docsDate', label: 'Дата документов', width: 'w-32' },
  { key: 'cargo', label: 'Груз', width: 'w-40' },
  { key: 'tempMode', label: 'Т°', width: 'w-16' },
  { key: 'weight', label: 'Вес, кг', width: 'w-24' },
  { key: 'status', label: 'Статус', width: 'w-36' },
  { key: 'shipmentType', label: 'Тип', width: 'w-24' },
  { key: 'terminal', label: 'Терминал', width: 'w-28' },
  { key: 'destination', label: 'Станция назначения', width: 'w-44' },
  { key: 'comment', label: 'Комментарий', width: 'w-44' },
];

function calcDaysOnTerminal(deliveryDate: string): number | null {
  if (!deliveryDate) return null;
  const d = new Date(deliveryDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / 86400000);
}

function EditableCell({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) {
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

function StatusCell({ value, onChange }: { value: ShipmentStatus; onChange: (v: ShipmentStatus) => void }) {
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

function ShipmentTypeCell({ value, onChange }: { value: ShipmentType; onChange: (v: ShipmentType) => void }) {
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

function FlightCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addFlight } = useAppStore();
  const [form, setForm] = useState({ number: '', direction: 'moscow', planDate: '', factDate: '' });

  const handleCreate = () => {
    if (!form.number || !form.direction || !form.planDate) return;
    addFlight({ id: `f${Date.now()}`, number: form.number, direction: form.direction as never, planDate: form.planDate, factDate: form.factDate, status: 'planned' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать рейс</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Номер рейса</Label>
            <Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="МСК-2026-005" />
          </div>
          <div className="space-y-1">
            <Label>Направление</Label>
            <Select value={form.direction} onValueChange={v => setForm({ ...form, direction: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="moscow">Москва</SelectItem>
                <SelectItem value="spb">Санкт-Петербург</SelectItem>
                <SelectItem value="novosibirsk">Новосибирск</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Дата плана</Label>
              <Input type="date" value={form.planDate} onChange={e => setForm({ ...form, planDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Дата факт</Label>
              <Input type="date" value={form.factDate} onChange={e => setForm({ ...form, factDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleCreate}>Создать</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_SHIPMENT: Omit<Shipment, 'id' | 'number'> = {
  request: '', client: '', containerNumber: '', footage: '40HC',
  deliveryDate: '', docsDate: '', inspectionDate: '', places: 0, weight: 0,
  cargo: '', tempMode: '', vsdNumber: '', status: 'not_ready', shipmentType: 'import',
  terminal: 'ПИК', destination: '', gngCode: '', etsnvCode: '', requestName: '',
  comment: '', dtNumber: '', billOfLading: '', subsidy: 'Нет', flightId: '',
};

function AddShipmentModal({ open, onClose, flightId, nextNumber }: { open: boolean; onClose: () => void; flightId: string; nextNumber: string }) {
  const { addShipment, flights } = useAppStore();
  const [form, setForm] = useState<Omit<Shipment, 'id' | 'number'>>({ ...EMPTY_SHIPMENT, flightId });

  const set = (key: keyof typeof form, val: string | number) => setForm(prev => ({ ...prev, [key]: val }));

  const handleAdd = () => {
    if (!form.client || !form.containerNumber) return;
    addShipment({ id: `s${Date.now()}`, number: nextNumber, ...form });
    setForm({ ...EMPTY_SHIPMENT, flightId });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить заявку</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="space-y-1">
            <Label>Заявка</Label>
            <Input value={form.request} onChange={e => set('request', e.target.value)} placeholder="ЗЯ-2026-000" />
          </div>
          <div className="space-y-1">
            <Label>Клиент *</Label>
            <Input value={form.client} onChange={e => set('client', e.target.value)} placeholder="ООО Название" />
          </div>
          <div className="space-y-1">
            <Label>Контейнер *</Label>
            <Input value={form.containerNumber} onChange={e => set('containerNumber', e.target.value)} placeholder="TCKU0000000" />
          </div>
          <div className="space-y-1">
            <Label>Футы</Label>
            <Select value={form.footage} onValueChange={v => set('footage', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['20', '40', '40HC', '45'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Дата завоза</Label>
            <Input type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Дата документов</Label>
            <Input type="date" value={form.docsDate} onChange={e => set('docsDate', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Груз</Label>
            <Input value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Мясо птицы" />
          </div>
          <div className="space-y-1">
            <Label>Темп. режим</Label>
            <Input value={form.tempMode} onChange={e => set('tempMode', e.target.value)} placeholder="-18" />
          </div>
          <div className="space-y-1">
            <Label>Вес, кг</Label>
            <Input type="number" value={form.weight || ''} onChange={e => set('weight', Number(e.target.value))} placeholder="18000" />
          </div>
          <div className="space-y-1">
            <Label>Мест</Label>
            <Input type="number" value={form.places || ''} onChange={e => set('places', Number(e.target.value))} placeholder="12" />
          </div>
          <div className="space-y-1">
            <Label>Тип отправки</Label>
            <Select value={form.shipmentType} onValueChange={v => set('shipmentType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="import">Импорт</SelectItem>
                <SelectItem value="rf">РФ</SelectItem>
                <SelectItem value="transit">Транзит</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Статус</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUSES_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Терминал</Label>
            <Select value={form.terminal} onValueChange={v => set('terminal', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TERMINALS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Рейс</Label>
            <Select value={form.flightId} onValueChange={v => set('flightId', v)}>
              <SelectTrigger><SelectValue placeholder="Выбрать рейс" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Без рейса</SelectItem>
                {flights.map(f => <SelectItem key={f.id} value={f.id}>{f.number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Станция назначения</Label>
            <Input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Москва-Товарная" />
          </div>
          <div className="space-y-1">
            <Label>Номер ВСД</Label>
            <Input value={form.vsdNumber} onChange={e => set('vsdNumber', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Номер ДТ</Label>
            <Input value={form.dtNumber} onChange={e => set('dtNumber', e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Комментарий</Label>
            <Input value={form.comment} onChange={e => set('comment', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleAdd} disabled={!form.client || !form.containerNumber}>Добавить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MoveToFlightModal({ open, onClose, shipmentIds }: { open: boolean; onClose: () => void; shipmentIds: string[] }) {
  const { flights, moveShipmentToFlight, currentUser } = useAppStore();
  const [selectedFlight, setSelectedFlight] = useState('');

  const handleMove = () => {
    if (!selectedFlight || !currentUser) return;
    shipmentIds.forEach(id => moveShipmentToFlight(id, selectedFlight, currentUser.id, currentUser.name));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Переместить в рейс</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">Выбрано строк: {shipmentIds.length}</p>
          <div className="space-y-1">
            <Label>Рейс</Label>
            <Select value={selectedFlight} onValueChange={setSelectedFlight}>
              <SelectTrigger><SelectValue placeholder="Выберите рейс" /></SelectTrigger>
              <SelectContent>
                {flights.map(f => <SelectItem key={f.id} value={f.id}>{f.number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleMove} disabled={!selectedFlight}>Переместить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PlanningRail() {
  const { shipments, flights, updateShipment, addShipment, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFlight, setFilterFlight] = useState('all');
  const [createFlight, setCreateFlight] = useState(false);
  const [addShipmentOpen, setAddShipmentOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || Object.values(s).some(v => String(v).toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchFlight = filterFlight === 'all' || s.flightId === filterFlight;
    return matchSearch && matchStatus && matchFlight;
  });

  const nextNumber = String(shipments.length + 1).padStart(3, '0');

  const handleEdit = (id: string, key: keyof Shipment, val: string) => {
    if (!currentUser) return;
    updateShipment(id, { [key]: val } as Partial<Shipment>, currentUser.id, currentUser.name);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleDrop = (flightId: string) => {
    if (!currentUser) return;
    const ids = dragId ? [dragId] : Array.from(selected);
    ids.forEach(id => updateShipment(id, { flightId }, currentUser.id, currentUser.name));
    setDragId(null);
  };

  const handleCopy = (s: Shipment) => {
    const copy: Shipment = {
      ...s,
      id: `s${Date.now()}`,
      number: String(shipments.length + 1).padStart(3, '0'),
      request: s.request ? `${s.request}-копия` : '',
    };
    addShipment(copy);
  };

  const exportCSV = () => {
    const rows = [COLS.map(c => c.label).join(';')];
    filtered.forEach(s => rows.push(COLS.map(c => String(s[c.key] ?? '')).join(';')));
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'planning.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по всем полям..." className="pl-8 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUSES_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFlight} onValueChange={setFilterFlight}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Рейс" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все рейсы</SelectItem>
            {flights.map(f => <SelectItem key={f.id} value={f.id}>{f.number}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV} className="h-9">
          <Icon name="Download" size={14} className="mr-1.5" /> Экспорт CSV
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={() => setCreateFlight(true)}>
          <Icon name="Train" size={14} className="mr-1.5" /> Создать рейс
        </Button>
        <Button size="sm" className="h-9" onClick={() => setAddShipmentOpen(true)}>
          <Icon name="Plus" size={14} className="mr-1.5" /> Добавить заявку
        </Button>
      </div>

      {flights.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <p className="text-xs text-muted-foreground">Перетащить в рейс:</p>
          {flights.map(f => (
            <div
              key={f.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(f.id)}
              className="px-3 py-1.5 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-default"
            >
              {f.number}
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-3 py-2.5 text-left">
                  <input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(s => s.id)) : new Set())} />
                </th>
                {COLS.map(col => (
                  <th key={col.key} className={cn('px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap', col.width)}>
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap w-20">Дней на терм.</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap w-36">Рейс</th>
                <th className="w-20 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={COLS.length + 4} className="text-center py-10 text-muted-foreground">Ничего не найдено</td></tr>
              )}
              {filtered.map(s => {
                const flight = flights.find(f => f.id === s.flightId);
                const days = calcDaysOnTerminal(s.deliveryDate);
                return (
                  <tr
                    key={s.id}
                    draggable
                    onDragStart={() => setDragId(s.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      'border-b border-border transition-colors group',
                      STATUS_ROW_COLORS[s.status],
                      selected.has(s.id) ? 'ring-1 ring-inset ring-primary/40' : '',
                      dragId === s.id && 'opacity-50',
                    )}
                  >
                    <td className="px-3 py-2">
                      <input type="checkbox" className="rounded" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                    </td>
                    {COLS.map(col => (
                      <td key={col.key} className={cn('px-3 py-2 text-foreground', col.width)}>
                        {col.key === 'status' ? (
                          <StatusCell value={s.status} onChange={v => handleEdit(s.id, 'status', v)} />
                        ) : col.key === 'shipmentType' ? (
                          <ShipmentTypeCell value={s.shipmentType} onChange={v => handleEdit(s.id, 'shipmentType', v)} />
                        ) : col.key === 'terminal' ? (
                          <select
                            value={s.terminal}
                            onChange={e => handleEdit(s.id, 'terminal', e.target.value)}
                            className="text-xs bg-transparent outline-none cursor-pointer text-foreground w-full"
                          >
                            {TERMINALS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <EditableCell value={String(s[col.key] ?? '')} onChange={v => handleEdit(s.id, col.key, v)} type={col.key.includes('Date') ? 'date' : 'text'} />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {days !== null ? (
                        <span className={cn(
                          'inline-flex items-center justify-center rounded-full px-2 py-0.5 font-semibold text-xs',
                          days > 14 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          days > 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        )}>
                          {days} д
                        </span>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {flight ? (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{flight.number}</span>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Копировать строку"
                          onClick={() => handleCopy(s)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Icon name="Copy" size={13} />
                        </button>
                        <button
                          title="Переместить в рейс"
                          onClick={() => { setSelected(new Set([s.id])); setMoveOpen(true); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Icon name="ArrowRightLeft" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {selected.size > 0 ? `Выбрано: ${selected.size} из ${filtered.length}` : `Всего: ${filtered.length} записей`}
          </span>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setMoveOpen(true)}>
                <Icon name="ArrowRightLeft" size={12} className="mr-1" /> Переместить в рейс
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
                Снять выделение
              </Button>
            </div>
          )}
        </div>
      </div>

      <FlightCreateModal open={createFlight} onClose={() => setCreateFlight(false)} />
      <AddShipmentModal open={addShipmentOpen} onClose={() => setAddShipmentOpen(false)} flightId="" nextNumber={nextNumber} />
      <MoveToFlightModal open={moveOpen} onClose={() => { setMoveOpen(false); setSelected(new Set()); }} shipmentIds={Array.from(selected)} />
    </div>
  );
}
