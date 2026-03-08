import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Shipment, STATUSES_LABEL } from '@/data/mock';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COLS, STATUS_ROW_COLORS, calcDaysOnTerminal, EditableCell, StatusCell, ShipmentTypeCell, TerminalCell, InspectionNoteCell } from './planning-rail/PlanningRailCells';
import { FlightCreateModal, AddShipmentModal, MoveToFlightModal } from './planning-rail/PlanningRailModals';
import { PlanningRailTable } from './planning-rail/PlanningRailTable';
import { InspectionRequestModal } from './planning-rail/InspectionRequestModal';

export default function PlanningRail() {
  const { shipments, flights, updateShipment, addShipment, deleteManyShipments, departFlight, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFlight, setFilterFlight] = useState('all');
  const [createFlight, setCreateFlight] = useState(false);
  const [addShipmentOpen, setAddShipmentOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [inspectionOpen, setInspectionOpen] = useState(false);

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || Object.values(s).some(v => String(v).toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchFlight = filterFlight === 'all' || (filterFlight === 'unassigned' ? !s.flightId : s.flightId === filterFlight);
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

  const handleDeleteSelected = () => {
    deleteManyShipments(Array.from(selected));
    setSelected(new Set());
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

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
          <Icon name="Train" size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Рейсы</span>
          {filterFlight !== 'all' && (
            <button onClick={() => setFilterFlight('all')} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Icon name="X" size={12} /> Сбросить фильтр
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-10">№</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-32">Контейнер</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-28">Статус</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-28">Заявка</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-36">Клиент</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-14">Футы</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-14">Дней</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'unassigned', label: 'Не распределённые', items: shipments.filter(s => !s.flightId), flight: null },
                ...flights.map(f => ({ id: f.id, label: f.number, items: shipments.filter(s => s.flightId === f.id), flight: f })),
              ].map(group => (
                <>
                  <tr
                    key={`group-${group.id}`}
                    className={cn(
                      'border-b border-border cursor-pointer select-none transition-colors',
                      filterFlight === group.id || (group.id === 'unassigned' && filterFlight === 'unassigned')
                        ? 'bg-primary/10'
                        : 'bg-muted/40 hover:bg-muted/60',
                    )}
                    onClick={() => {
                      if (group.id === 'unassigned') {
                        setFilterFlight(prev => prev === 'unassigned' ? 'all' : 'unassigned');
                      } else {
                        setFilterFlight(prev => prev === group.id ? 'all' : group.id);
                      }
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(group.id === 'unassigned' ? '' : group.id)}
                  >
                    <td colSpan={7} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Train" size={12} className={cn(
                          filterFlight === group.id || (group.id === 'unassigned' && filterFlight === 'unassigned')
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'font-semibold',
                          filterFlight === group.id || (group.id === 'unassigned' && filterFlight === 'unassigned')
                            ? 'text-primary'
                            : 'text-foreground'
                        )}>
                          {group.label}
                        </span>
                        <span className="text-muted-foreground text-[11px]">({group.items.length})</span>
                        {group.flight && group.flight.status !== 'departed' && (
                          <Button
                            size="sm"
                            className="h-5 text-[10px] px-2 ml-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={e => {
                              e.stopPropagation();
                              if (!currentUser) return;
                              departFlight(group.flight!.id, currentUser.id, currentUser.name);
                            }}
                          >
                            <Icon name="Train" size={10} className="mr-1" /> В путь
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {group.items.map((s, idx) => {
                    const days = calcDaysOnTerminal(s.deliveryDate);
                    return (
                      <tr
                        key={s.id}
                        draggable
                        onDragStart={() => setDragId(s.id)}
                        onDragEnd={() => setDragId(null)}
                        className={cn('border-b border-border transition-colors', STATUS_ROW_COLORS[s.status], dragId === s.id && 'opacity-50')}
                      >
                        <td className="px-3 py-1.5 text-muted-foreground font-medium pl-7">{idx + 1}</td>
                        <td className="px-3 py-1.5 text-foreground font-medium">{s.containerNumber || '—'}</td>
                        <td className="px-3 py-1.5">
                          <StatusCell value={s.status} onChange={v => handleEdit(s.id, 'status', v)} />
                        </td>
                        <td className="px-3 py-1.5 text-foreground">{s.request || '—'}</td>
                        <td className="px-3 py-1.5 text-foreground">{s.client || '—'}</td>
                        <td className="px-3 py-1.5 text-foreground">{s.footage || '—'}</td>
                        <td className="px-3 py-1.5">
                          {days !== null ? (
                            <span className={cn(
                              'inline-flex items-center justify-center rounded-full px-2 py-0.5 font-semibold text-xs',
                              days > 14 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              days > 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            )}>
                              {days}д
                            </span>
                          ) : <span className="text-muted-foreground/40">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
        onDeleteSelected={handleDeleteSelected}
        onInspectionRequest={() => setInspectionOpen(true)}
      />

      <FlightCreateModal open={createFlight} onClose={() => setCreateFlight(false)} />
      <AddShipmentModal open={addShipmentOpen} onClose={() => setAddShipmentOpen(false)} flightId="" nextNumber={nextNumber} />
      <MoveToFlightModal open={moveOpen} onClose={() => { setMoveOpen(false); setSelected(new Set()); }} shipmentIds={Array.from(selected)} />
      {inspectionOpen && (
        <InspectionRequestModal
          shipments={filtered.filter(s => selected.has(s.id))}
          onClose={() => setInspectionOpen(false)}
        />
      )}
    </div>
  );
}