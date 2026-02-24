import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Shipment, STATUSES_LABEL, SHIPMENT_TYPE_LABEL } from '@/data/mock';
import { ShipmentBadge } from '@/components/StatusBadge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COLS, STATUS_ROW_COLORS } from './planning-rail/PlanningRailCells';
import { FlightCreateModal, AddShipmentModal, MoveToFlightModal } from './planning-rail/PlanningRailModals';
import { PlanningRailTable } from './planning-rail/PlanningRailTable';

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
  const [flightPanelId, setFlightPanelId] = useState<string | null>(null);

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
    addShipment({
      ...s,
      id: `s${Date.now()}`,
      number: String(shipments.length + 1).padStart(3, '0'),
      request: s.request ? `${s.request}-копия` : '',
    });
  };

  const handleCopySelected = () => {
    const toCopy = filtered.filter(s => selected.has(s.id));
    toCopy.forEach((s, i) => {
      addShipment({
        ...s,
        id: `s${Date.now() + i}`,
        number: String(shipments.length + 1 + i).padStart(3, '0'),
        request: s.request ? `${s.request}-копия` : '',
      });
    });
    setSelected(new Set());
  };

  const panelShipments = flightPanelId === 'unassigned'
    ? shipments.filter(s => !s.flightId)
    : flightPanelId
      ? shipments.filter(s => s.flightId === flightPanelId)
      : [];
  const panelFlight = flightPanelId && flightPanelId !== 'unassigned'
    ? flights.find(f => f.id === flightPanelId)
    : null;
  const panelTitle = flightPanelId === 'unassigned'
    ? 'Не распределённые'
    : panelFlight?.number ?? '';

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

      <div className="flex gap-2 flex-wrap items-center">
        <p className="text-xs text-muted-foreground shrink-0">Рейсы:</p>
        <div
          onClick={() => setFlightPanelId(prev => prev === 'unassigned' ? null : 'unassigned')}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop('')}
          className={cn(
            'px-3 py-1.5 rounded-lg border-2 border-dashed text-xs transition-colors cursor-pointer',
            flightPanelId === 'unassigned'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
          )}
        >
          Не распределённые ({shipments.filter(s => !s.flightId).length})
        </div>
        {flights.map(f => {
          const count = shipments.filter(s => s.flightId === f.id).length;
          return (
            <div
              key={f.id}
              onClick={() => setFlightPanelId(prev => prev === f.id ? null : f.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg border-2 border-dashed text-xs transition-colors cursor-pointer',
                flightPanelId === f.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              )}
            >
              {f.number} ({count})
            </div>
          );
        })}
      </div>

      {flightPanelId && (
        <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold text-foreground">{panelTitle}</span>
            <button onClick={() => setFlightPanelId(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="X" size={14} />
            </button>
          </div>
          {panelShipments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Нет заявок</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-max w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {['№', 'Заявка', 'Клиент', 'Контейнер', 'Футы', 'Груз', 'Т°', 'Вес, кг', 'Статус', 'Тип', 'Терминал'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {panelShipments.map(s => (
                    <tr key={s.id} className={cn('border-b border-border last:border-0', STATUS_ROW_COLORS[s.status])}>
                      <td className="px-3 py-2 text-foreground">{s.number}</td>
                      <td className="px-3 py-2 text-foreground">{s.request || '—'}</td>
                      <td className="px-3 py-2 text-foreground">{s.client}</td>
                      <td className="px-3 py-2 font-mono text-foreground">{s.containerNumber}</td>
                      <td className="px-3 py-2 text-foreground">{s.footage}</td>
                      <td className="px-3 py-2 text-foreground">{s.cargo}</td>
                      <td className="px-3 py-2 text-foreground">{s.tempMode}</td>
                      <td className="px-3 py-2 text-foreground">{s.weight.toLocaleString('ru')}</td>
                      <td className="px-3 py-2"><ShipmentBadge status={s.status} /></td>
                      <td className="px-3 py-2 text-foreground">{SHIPMENT_TYPE_LABEL[s.shipmentType]}</td>
                      <td className="px-3 py-2 text-foreground">{s.terminal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-2 border-t border-border bg-muted/10">
            <span className="text-xs text-muted-foreground">Всего: {panelShipments.length} заявок</span>
          </div>
        </div>
      )}

      <PlanningRailTable
        filtered={filtered}
        flights={flights}
        selected={selected}
        dragId={dragId}
        onToggleSelect={toggleSelect}
        onSelectAll={checked => setSelected(checked ? new Set(filtered.map(s => s.id)) : new Set())}
        onDragStart={id => setDragId(id)}
        onDragEnd={() => setDragId(null)}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onMoveOne={id => { setSelected(new Set([id])); setMoveOpen(true); }}
        onCopySelected={handleCopySelected}
        onMoveSelected={() => setMoveOpen(true)}
        onClearSelected={() => setSelected(new Set())}
      />

      <FlightCreateModal open={createFlight} onClose={() => setCreateFlight(false)} />
      <AddShipmentModal open={addShipmentOpen} onClose={() => setAddShipmentOpen(false)} flightId="" nextNumber={nextNumber} />
      <MoveToFlightModal open={moveOpen} onClose={() => { setMoveOpen(false); setSelected(new Set()); }} shipmentIds={Array.from(selected)} />
    </div>
  );
}
