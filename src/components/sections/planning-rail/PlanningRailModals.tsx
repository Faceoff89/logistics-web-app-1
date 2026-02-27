import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Shipment, TERMINALS, STATUSES_LABEL } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function FlightCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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

export function AddShipmentModal({ open, onClose, flightId, nextNumber }: { open: boolean; onClose: () => void; flightId: string; nextNumber: string }) {
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
                <SelectItem value="none">Без рейса</SelectItem>
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

export function MoveToFlightModal({ open, onClose, shipmentIds }: { open: boolean; onClose: () => void; shipmentIds: string[] }) {
  const { flights, moveShipmentToFlight, updateShipment, currentUser } = useAppStore();
  const [selectedFlight, setSelectedFlight] = useState('');

  const handleMove = () => {
    if (!currentUser) return;
    if (selectedFlight === 'unassigned') {
      shipmentIds.forEach(id => updateShipment(id, { flightId: '' }, currentUser.id, currentUser.name));
    } else {
      if (!selectedFlight) return;
      shipmentIds.forEach(id => moveShipmentToFlight(id, selectedFlight, currentUser.id, currentUser.name));
    }
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
                <SelectItem value="unassigned">Не распределённые</SelectItem>
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