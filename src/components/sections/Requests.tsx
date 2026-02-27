import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Shipment, ShipmentStatus, STATUSES_LABEL, TERMINALS, SHIPMENT_TYPE_LABEL } from '@/data/mock';
import { ShipmentBadge } from '@/components/StatusBadge';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const EMPTY: Omit<Shipment, 'id' | 'number' | 'containerNumber'> & { containerCount: number } = {
  request: '', client: '', footage: '40HC',
  deliveryDate: '', docsDate: '', inspectionDate: '', places: 0, weight: 0,
  cargo: '', tempMode: '-18', vsdNumber: '', status: 'not_ready', shipmentType: 'import',
  terminal: 'ПИК', destination: '', gngCode: '', etsnvCode: '', requestName: '',
  comment: '', dtNumber: '', billOfLading: '', subsidy: 'Нет', flightId: '',
  containerCount: 1,
};

const STATUS_ROW: Record<ShipmentStatus, string> = {
  ready: 'border-l-emerald-400',
  not_ready: 'border-l-amber-400',
  in_transit: 'border-l-blue-400',
  delayed: 'border-l-red-400',
};

export default function Requests() {
  const { shipments, addShipment, flights, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    return !q || s.request.toLowerCase().includes(q) || s.client.toLowerCase().includes(q) || s.cargo.toLowerCase().includes(q);
  });

  const uniqueRequests = Array.from(
    filtered.reduce((map, s) => {
      const key = s.request || s.id;
      if (!map.has(key)) map.set(key, { ...s, _count: 1 });
      else map.get(key)!._count++;
      return map;
    }, new Map<string, Shipment & { _count: number }>()).values()
  );

  const handleCreate = () => {
    if (!form.request || !form.client) return;
    const count = Math.max(1, form.containerCount);
    const base = shipments.length;
    for (let i = 0; i < count; i++) {
      const id = `s${Date.now()}${i}`;
      const number = String(base + i + 1).padStart(3, '0');
      addShipment({
        id,
        number,
        containerNumber: '',
        request: form.request,
        client: form.client,
        footage: form.footage,
        deliveryDate: form.deliveryDate,
        docsDate: form.docsDate,
        inspectionDate: form.inspectionDate,
        places: form.places,
        weight: form.weight,
        cargo: form.cargo,
        tempMode: form.tempMode,
        vsdNumber: form.vsdNumber,
        status: form.status,
        shipmentType: form.shipmentType,
        terminal: form.terminal,
        destination: form.destination,
        gngCode: form.gngCode,
        etsnvCode: form.etsnvCode,
        requestName: form.requestName,
        comment: form.comment,
        dtNumber: form.dtNumber,
        billOfLading: form.billOfLading,
        subsidy: form.subsidy,
        flightId: form.flightId,
      });
    }
    setModal(false);
    setForm(EMPTY);
  };

  const f = (key: keyof typeof form) => (val: string | number) =>
    setForm(prev => ({ ...prev, [key]: val }));

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

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Заявка</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Клиент</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Груз</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Т°</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Контейнеров</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Терминал</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Рейс</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Статус</th>
            </tr>
          </thead>
          <tbody>
            {uniqueRequests.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                  Нет заявок. Нажмите «Создать заявку».
                </td>
              </tr>
            )}
            {uniqueRequests.map(s => {
              const flight = flights.find(f => f.id === s.flightId);
              return (
                <tr
                  key={s.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/30 transition-colors border-l-2',
                    STATUS_ROW[s.status],
                  )}
                >
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-foreground">{s.request || '—'}</span>
                  </td>
                  <td className="px-3 py-2.5 text-foreground">{s.client}</td>
                  <td className="px-3 py-2.5 text-foreground">{s.cargo}</td>
                  <td className="px-3 py-2.5 text-foreground font-mono text-xs">{s.tempMode}°C</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 bg-muted rounded-full px-2 py-0.5 text-xs font-medium text-foreground">
                      <Icon name="Container" size={11} />
                      {s._count}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-foreground">{s.terminal}</td>
                  <td className="px-3 py-2.5 text-foreground">{flight ? flight.number : '—'}</td>
                  <td className="px-3 py-2.5">
                    <ShipmentBadge status={s.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Создать заявку</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">

            <div className="space-y-1 col-span-2">
              <Label>Количество контейнеров</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.containerCount}
                onChange={e => f('containerCount')(Number(e.target.value))}
                className="font-semibold"
              />
              <p className="text-xs text-muted-foreground">В Планировании ЖД появится {form.containerCount} строк с этой заявкой</p>
            </div>

            <div className="space-y-1">
              <Label>Номер заявки *</Label>
              <Input value={form.request} onChange={e => f('request')(e.target.value)} placeholder="ЗЯ-2026-000" />
            </div>
            <div className="space-y-1">
              <Label>Клиент *</Label>
              <Input value={form.client} onChange={e => f('client')(e.target.value)} placeholder="ООО Название" />
            </div>

            <div className="space-y-1">
              <Label>Груз</Label>
              <Input value={form.cargo} onChange={e => f('cargo')(e.target.value)} placeholder="Мясо птицы" />
            </div>
            <div className="space-y-1">
              <Label>Темп. режим</Label>
              <Input value={form.tempMode} onChange={e => f('tempMode')(e.target.value)} placeholder="-18" />
            </div>

            <div className="space-y-1">
              <Label>Футы</Label>
              <Select value={form.footage} onValueChange={f('footage')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['20', '40', '40HC', '45'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Тип отправки</Label>
              <Select value={form.shipmentType} onValueChange={f('shipmentType')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="import">Импорт</SelectItem>
                  <SelectItem value="rf">РФ</SelectItem>
                  <SelectItem value="transit">Транзит</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Терминал</Label>
              <Select value={form.terminal} onValueChange={f('terminal')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TERMINALS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Рейс</Label>
              <Select value={form.flightId} onValueChange={f('flightId')}>
                <SelectTrigger><SelectValue placeholder="Без рейса" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без рейса</SelectItem>
                  {flights.map(fl => <SelectItem key={fl.id} value={fl.id}>{fl.number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Дата завоза</Label>
              <Input type="date" value={form.deliveryDate} onChange={e => f('deliveryDate')(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Дата документов</Label>
              <Input type="date" value={form.docsDate} onChange={e => f('docsDate')(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Вес, кг</Label>
              <Input type="number" value={form.weight || ''} onChange={e => f('weight')(Number(e.target.value))} placeholder="18000" />
            </div>
            <div className="space-y-1">
              <Label>Мест</Label>
              <Input type="number" value={form.places || ''} onChange={e => f('places')(Number(e.target.value))} placeholder="12" />
            </div>

            <div className="space-y-1 col-span-2">
              <Label>Станция назначения</Label>
              <Input value={form.destination} onChange={e => f('destination')(e.target.value)} placeholder="Москва-Товарная" />
            </div>
            <div className="space-y-1">
              <Label>Номер ВСД</Label>
              <Input value={form.vsdNumber} onChange={e => f('vsdNumber')(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Статус</Label>
              <Select value={form.status} onValueChange={f('status')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUSES_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Комментарий</Label>
              <Input value={form.comment} onChange={e => f('comment')(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
            <Button variant="outline" onClick={() => setModal(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={!form.request || !form.client}>
              Создать {form.containerCount > 1 ? `(${form.containerCount} контейнера)` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
