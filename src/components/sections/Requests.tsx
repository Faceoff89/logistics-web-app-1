import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Shipment, ShipmentStatus, DIRECTIONS_LABEL, STATUSES_LABEL, TERMINALS } from '@/data/mock';
import { ShipmentBadge } from '@/components/StatusBadge';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EMPTY: Omit<Shipment, 'id'> = {
  number: '', request: '', client: '', containerNumber: '', footage: '40HC',
  deliveryDate: '', docsDate: '', inspectionDate: '', places: 0, weight: 0,
  cargo: '', tempMode: '-18', vsdNumber: '', status: 'not_ready', terminal: 'ПИК',
  destination: '', gngCode: '', etsnvCode: '', requestName: '', comment: '',
  dtNumber: '', billOfLading: '', subsidy: 'Нет', flightId: '',
};

export default function Requests() {
  const { shipments, addShipment, flights, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Omit<Shipment, 'id'>>(EMPTY);

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    return !q || s.request.toLowerCase().includes(q) || s.client.toLowerCase().includes(q) || s.cargo.toLowerCase().includes(q);
  });

  const handleCreate = () => {
    if (!form.request || !form.client) return;
    addShipment({ ...form, id: `s${Date.now()}`, number: String(shipments.length + 1).padStart(3, '0') });
    setModal(false);
    setForm(EMPTY);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по заявке, клиенту, грузу..." className="pl-8 h-9 text-sm" />
        </div>
        <Button size="sm" className="h-9" onClick={() => setModal(true)}>
          <Icon name="Plus" size={14} className="mr-1.5" /> Создать заявку
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(s => {
          const flight = flights.find(f => f.id === s.flightId);
          return (
            <div key={s.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow animate-fade-in">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.request}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.client}</p>
                </div>
                <ShipmentBadge status={s.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div><span className="text-muted-foreground">Контейнер</span><p className="font-mono font-medium text-foreground">{s.containerNumber}</p></div>
                <div><span className="text-muted-foreground">Груз</span><p className="text-foreground">{s.cargo}</p></div>
                <div><span className="text-muted-foreground">Терминал</span><p className="text-foreground">{s.terminal}</p></div>
                <div><span className="text-muted-foreground">Т° режим</span><p className="font-medium text-foreground">{s.tempMode}°C</p></div>
                <div><span className="text-muted-foreground">Вес</span><p className="text-foreground">{s.weight.toLocaleString('ru')} кг</p></div>
                <div><span className="text-muted-foreground">Рейс</span><p className="text-foreground">{flight ? flight.number : '—'}</p></div>
              </div>
              {s.comment && (
                <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">{s.comment}</p>
              )}
              {s.editedBy && (
                <p className="mt-2 text-[10px] text-muted-foreground/60">Изменено: {s.editedBy} · {s.editedAt}</p>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Создать заявку</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {([
              ['Номер заявки', 'request', 'text'],
              ['Клиент', 'client', 'text'],
              ['Номер контейнера', 'containerNumber', 'text'],
              ['Груз', 'cargo', 'text'],
              ['Т° режим', 'tempMode', 'text'],
              ['Вес, кг', 'weight', 'number'],
              ['Дата завоза', 'deliveryDate', 'date'],
              ['Дата документов', 'docsDate', 'date'],
              ['Станция назначения', 'destination', 'text'],
              ['Номер ВСД', 'vsdNumber', 'text'],
            ] as [string, keyof Shipment, string][]).map(([label, key, type]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={String(form[key] ?? '')}
                  onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label>Терминал</Label>
              <Select value={form.terminal} onValueChange={v => setForm({ ...form, terminal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TERMINALS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Рейс</Label>
              <Select value={form.flightId} onValueChange={v => setForm({ ...form, flightId: v })}>
                <SelectTrigger><SelectValue placeholder="Выберите рейс" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без рейса</SelectItem>
                  {flights.map(f => <SelectItem key={f.id} value={f.id}>{f.number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Комментарий</Label>
              <Input value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
            <Button variant="outline" onClick={() => setModal(false)}>Отмена</Button>
            <Button onClick={handleCreate}>Создать</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}