import { useState, Fragment } from 'react';
import { useAppStore } from '@/store/appStore';
import { Shipment, InspectionNote, STATUSES_LABEL } from '@/data/mock';
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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

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
    const ids = dragId && selected.has(dragId) ? Array.from(selected) : dragId ? [dragId] : Array.from(selected);
    ids.forEach(id => updateShipment(id, { flightId }, currentUser.id, currentUser.name));
    setDragId(null);
    setDragOverGroup(null);
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

  const toggleCollapse = (groupId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) { next.delete(groupId); } else { next.add(groupId); }
      return next;
    });
  };

  const toggleGroupSelect = (items: Shipment[]) => {
    const ids = items.map(s => s.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const flightGroups = [
    { id: 'unassigned', label: 'Не распределённые', items: shipments.filter(s => !s.flightId), flight: null },
    ...flights.map(f => ({ id: f.id, label: f.number, items: shipments.filter(s => s.flightId === f.id), flight: f })),
  ];

  const totalFlightCols = 1 + COLS.length + 1 + 1; // checkbox + COLS + days + flight

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по всем полям..." className="pl-8 h-8 text-[11px]" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-[11px]"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUSES_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFlight} onValueChange={setFilterFlight}>
          <SelectTrigger className="w-40 h-8 text-[11px]"><SelectValue placeholder="Рейс" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все рейсы</SelectItem>
            {flights.map(f => <SelectItem key={f.id} value={f.id}>{f.number}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 text-[11px]">
          <Icon name="Download" size={13} className="mr-1" /> Экспорт CSV
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setCreateFlight(true)}>
          <Icon name="Train" size={13} className="mr-1" /> Создать рейс
        </Button>
        <Button size="sm" className="h-8 text-[11px]" onClick={() => setAddShipmentOpen(true)}>
          <Icon name="Plus" size={13} className="mr-1" /> Добавить заявку
        </Button>
      </div>

      {/* ====== Flights Block ====== */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-2.5 py-1.5 border-b border-border bg-muted/30 flex items-center gap-1.5">
          <Icon name="Train" size={13} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Рейсы</span>
          {filterFlight !== 'all' && (
            <button onClick={() => setFilterFlight('all')} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Icon name="X" size={11} /> Сбросить фильтр
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-[11px]">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-1.5 py-1 text-left font-semibold text-muted-foreground w-7">
                  <span className="sr-only">Select</span>
                </th>
                {COLS.map(col => (
                  <th key={col.key} className={cn('px-1.5 py-1 text-left font-semibold text-muted-foreground whitespace-nowrap', col.width)}>
                    {col.label}
                  </th>
                ))}
                <th className="px-1.5 py-1 text-left font-semibold text-muted-foreground w-12">Дней</th>
                <th className="px-1.5 py-1 text-left font-semibold text-muted-foreground w-24">Рейс</th>
              </tr>
            </thead>
            <tbody>
              {flightGroups.map(group => {
                const isGroupActive = filterFlight === group.id || (group.id === 'unassigned' && filterFlight === 'unassigned');
                const isCollapsed = collapsed.has(group.id);
                const allGroupSelected = group.items.length > 0 && group.items.every(s => selected.has(s.id));
                const someGroupSelected = group.items.some(s => selected.has(s.id));
                return (
                  <Fragment key={`frag-${group.id}`}>
                    <tr
                      className={cn(
                        'border-b border-border select-none transition-colors',
                        dragOverGroup === group.id
                          ? 'bg-primary/20 ring-2 ring-inset ring-primary/50'
                          : isGroupActive
                            ? 'bg-primary/10'
                            : 'bg-muted/40 hover:bg-muted/60',
                      )}
                      onDragOver={e => { e.preventDefault(); setDragOverGroup(group.id); }}
                      onDragLeave={() => setDragOverGroup(null)}
                      onDrop={e => { e.preventDefault(); handleDrop(group.id === 'unassigned' ? '' : group.id); }}
                    >
                      <td className="px-1.5 py-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={allGroupSelected}
                          ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                          onChange={() => toggleGroupSelect(group.items)}
                        />
                      </td>
                      <td
                        colSpan={totalFlightCols - 1}
                        className="px-1.5 py-1 cursor-pointer"
                        onClick={() => toggleCollapse(group.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon
                            name={isCollapsed ? 'ChevronRight' : 'ChevronDown'}
                            size={12}
                            className="text-muted-foreground flex-shrink-0"
                          />
                          <Icon name="Train" size={11} className={cn(isGroupActive ? 'text-primary' : 'text-muted-foreground')} />
                          <span className={cn('font-semibold text-[11px]', isGroupActive ? 'text-primary' : 'text-foreground')}>
                            {group.label}
                          </span>
                          <span className="text-muted-foreground text-[10px]">({group.items.length})</span>
                          <button
                            className={cn(
                              'ml-1 p-0.5 rounded hover:bg-muted/60 transition-colors',
                              isGroupActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                            title="Фильтр по рейсу"
                            onClick={e => {
                              e.stopPropagation();
                              if (group.id === 'unassigned') {
                                setFilterFlight(prev => prev === 'unassigned' ? 'all' : 'unassigned');
                              } else {
                                setFilterFlight(prev => prev === group.id ? 'all' : group.id);
                              }
                            }}
                          >
                            <Icon name="Filter" size={10} />
                          </button>
                          {group.flight && group.flight.status !== 'departed' && (
                            <Button
                              size="sm"
                              className="h-5 text-[10px] px-1.5 ml-1 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={e => {
                                e.stopPropagation();
                                if (!currentUser) return;
                                departFlight(group.flight!.id, currentUser.id, currentUser.name);
                              }}
                            >
                              <Icon name="Train" size={10} className="mr-0.5" /> В путь
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && group.items.map((s, idx) => {
                      const days = calcDaysOnTerminal(s.deliveryDate);
                      const flight = flights.find(f => f.id === s.flightId);
                      const isSelected = selected.has(s.id);
                      return (
                        <tr
                          key={s.id}
                          draggable
                          onDragStart={() => setDragId(s.id)}
                          onDragEnd={() => { setDragId(null); setDragOverGroup(null); }}
                          className={cn(
                            'border-b border-border transition-colors group/row',
                            STATUS_ROW_COLORS[s.status],
                            isSelected && 'ring-1 ring-inset ring-primary/40',
                            dragId === s.id && 'opacity-50',
                          )}
                        >
                          <td className="px-1.5 py-0.5">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={isSelected}
                              onChange={() => toggleSelect(s.id)}
                            />
                          </td>
                          {COLS.map(col => (
                            <td key={col.key} className={cn('px-1.5 py-0.5 text-foreground', col.width)}>
                              {col.key === 'number' ? (
                                <span className="text-muted-foreground font-medium">{idx + 1}</span>
                              ) : col.key === 'status' ? (
                                <StatusCell value={s.status} onChange={v => handleEdit(s.id, 'status', v)} />
                              ) : col.key === 'shipmentType' ? (
                                <ShipmentTypeCell value={s.shipmentType} onChange={v => handleEdit(s.id, 'shipmentType', v)} />
                              ) : col.key === 'terminal' ? (
                                <TerminalCell value={s.terminal} onChange={v => handleEdit(s.id, 'terminal', v)} />
                              ) : col.key === 'inspectionNote' ? (
                                <InspectionNoteCell
                                  value={(s.inspectionNote || 'without_connection') as InspectionNote}
                                  onChange={v => handleEdit(s.id, 'inspectionNote', v)}
                                />
                              ) : (
                                <EditableCell
                                  value={String(s[col.key] ?? '')}
                                  onChange={v => handleEdit(s.id, col.key, v)}
                                  type={col.key.includes('Date') ? 'date' : 'text'}
                                />
                              )}
                            </td>
                          ))}
                          <td className="px-1.5 py-0.5 w-12">
                            {days !== null ? (
                              <span className={cn(
                                'inline-flex items-center justify-center rounded-full px-1.5 py-0 font-semibold text-[10px]',
                                days > 14 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                days > 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              )}>
                                {days}д
                              </span>
                            ) : <span className="text-muted-foreground/40">--</span>}
                          </td>
                          <td className="px-1.5 py-0.5 w-24">
                            {flight
                              ? <span className="text-[10px] text-muted-foreground whitespace-nowrap">{flight.number}</span>
                              : <span className="text-muted-foreground/40">--</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
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