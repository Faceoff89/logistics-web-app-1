import { useState, useMemo } from 'react';
import { Shipment, Flight, InspectionNote } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ColFilter } from '@/components/ui/col-filter';
import {
  COLS, STATUS_ROW_COLORS, calcDaysOnTerminal,
  EditableCell, StatusCell, ShipmentTypeCell, TerminalCell, InspectionNoteCell,
} from './PlanningRailCells';

interface PlanningRailTableProps {
  filtered: Shipment[];
  flights: Flight[];
  selected: Set<string>;
  dragId: string | null;
  onToggleSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onEdit: (id: string, key: keyof Shipment, val: string) => void;
  onCopy: (s: Shipment) => void;
  onMoveOne: (id: string) => void;
  onCopySelected: () => void;
  onMoveSelected: () => void;
  onClearSelected: () => void;
  onDeleteSelected: () => void;
  onInspectionRequest: () => void;
}

export function PlanningRailTable({
  filtered, flights, selected, dragId,
  onToggleSelect, onSelectAll, onDragStart, onDragEnd,
  onEdit, onCopy, onMoveOne,
  onCopySelected, onMoveSelected, onClearSelected, onDeleteSelected,
  onInspectionRequest,
}: PlanningRailTableProps) {
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Shipment | 'flight', string>>>({});
  const [sortCol, setSortCol] = useState<keyof Shipment | 'flight' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  const setFilter = (key: string, val: string) =>
    setColFilters(p => ({ ...p, [key]: val }));

  const handleSort = (key: keyof Shipment | 'flight', dir: 'asc' | 'desc' | null) => {
    if (dir === null) { setSortCol(null); setSortDir(null); }
    else { setSortCol(key); setSortDir(dir); }
  };

  const hasFilters = Object.values(colFilters).some(v => v);

  const displayed = useMemo(() => {
    let result = filtered.filter(s => {
      for (const [key, val] of Object.entries(colFilters)) {
        if (!val) continue;
        const q = val.toLowerCase();
        if (key === 'flight') {
          const flight = flights.find(f => f.id === s.flightId);
          if (!(flight?.number || '').toLowerCase().includes(q)) return false;
        } else {
          if (!String(s[key as keyof Shipment] ?? '').toLowerCase().includes(q)) return false;
        }
      }
      return true;
    });
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = sortCol === 'flight'
          ? (flights.find(f => f.id === a.flightId)?.number || '')
          : String(a[sortCol as keyof Shipment] ?? '');
        const bVal = sortCol === 'flight'
          ? (flights.find(f => f.id === b.flightId)?.number || '')
          : String(b[sortCol as keyof Shipment] ?? '');
        return sortDir === 'asc' ? aVal.localeCompare(bVal, 'ru') : bVal.localeCompare(aVal, 'ru');
      });
    }
    return result;
  }, [filtered, colFilters, flights, sortCol, sortDir]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {hasFilters && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-amber-50/60 dark:bg-amber-900/10">
          <Icon name="Filter" size={12} className="text-amber-600" />
          <span className="text-xs text-amber-700 dark:text-amber-400">Активны фильтры по столбцам</span>
          <button
            onClick={() => setColFilters({})}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Icon name="FilterX" size={12} /> Сбросить
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-max w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-7 px-2 py-2 text-left">
                <input
                  type="checkbox"
                  className="rounded"
                  onChange={e => onSelectAll(e.target.checked)}
                />
              </th>
              {COLS.map((col, colIdx) => (
                <>
                  <th key={col.key} className={cn('px-2 py-1.5 text-left font-semibold text-muted-foreground', col.width)}>
                    <div className="whitespace-nowrap mb-1">{col.label}</div>
                    <ColFilter
                      value={colFilters[col.key] || ''}
                      onChange={v => setFilter(col.key, v)}
                      sortDir={sortCol === col.key ? sortDir : null}
                      onSort={dir => handleSort(col.key, dir)}
                    />
                  </th>
                  {colIdx === 0 && (
                    <th key="days-header" className="px-2 py-1.5 text-left font-semibold text-muted-foreground w-14">
                      <div className="whitespace-nowrap mb-1">Дней</div>
                    </th>
                  )}
                </>
              ))}
              <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground w-32">
                <div className="whitespace-nowrap mb-1">Рейс</div>
                <ColFilter
                  value={colFilters['flight'] || ''}
                  onChange={v => setFilter('flight', v)}
                  sortDir={sortCol === 'flight' ? sortDir : null}
                  onSort={dir => handleSort('flight', dir)}
                />
              </th>
              <th className="w-16 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 4} className="text-center py-10 text-muted-foreground">
                  Ничего не найдено
                </td>
              </tr>
            )}
            {displayed.map((s, idx) => {
              const flight = flights.find(f => f.id === s.flightId);
              const days = calcDaysOnTerminal(s.deliveryDate);
              return (
                <tr
                  key={s.id}
                  draggable
                  onDragStart={() => onDragStart(s.id)}
                  onDragEnd={onDragEnd}
                  className={cn(
                    'border-b border-border transition-colors group',
                    STATUS_ROW_COLORS[s.status],
                    selected.has(s.id) ? 'ring-1 ring-inset ring-primary/40' : '',
                    dragId === s.id && 'opacity-50',
                  )}
                >
                  <td className="px-2 py-1.5">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selected.has(s.id)}
                      onChange={() => onToggleSelect(s.id)}
                    />
                  </td>
                  {COLS.map((col, colIdx) => (
                    <>
                      <td key={col.key} className={cn('px-2 py-1.5 text-foreground', col.width)}>
                        {col.key === 'number' ? (
                          <span className="text-muted-foreground font-medium">{idx + 1}</span>
                        ) : col.key === 'status' ? (
                          <StatusCell value={s.status} onChange={v => onEdit(s.id, 'status', v)} />
                        ) : col.key === 'shipmentType' ? (
                          <ShipmentTypeCell value={s.shipmentType} onChange={v => onEdit(s.id, 'shipmentType', v)} />
                        ) : col.key === 'terminal' ? (
                          <TerminalCell value={s.terminal} onChange={v => onEdit(s.id, 'terminal', v)} />
                        ) : col.key === 'inspectionNote' ? (
                          <InspectionNoteCell
                            value={(s.inspectionNote || 'without_connection') as InspectionNote}
                            onChange={v => onEdit(s.id, 'inspectionNote', v)}
                          />
                        ) : (
                          <EditableCell
                            value={String(s[col.key] ?? '')}
                            onChange={v => onEdit(s.id, col.key, v)}
                            type={col.key.includes('Date') ? 'date' : 'text'}
                          />
                        )}
                      </td>
                      {colIdx === 0 && (
                        <td key="days-cell" className="px-2 py-1.5 w-14">
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
                      )}
                    </>
                  ))}
                  <td className="px-2 py-1.5">
                    {flight
                      ? <span className="text-[10px] text-muted-foreground whitespace-nowrap">{flight.number}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-1.5 py-1.5">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Копировать строку"
                        onClick={() => onCopy(s)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon name="Copy" size={12} />
                      </button>
                      <button
                        title="Переместить в рейс"
                        onClick={() => onMoveOne(s.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon name="ArrowRightLeft" size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          {selected.size > 0
            ? `Выбрано: ${selected.size} из ${displayed.length}`
            : `Всего: ${displayed.length} записей${hasFilters ? ` (отфильтровано из ${filtered.length})` : ''}`}
        </span>
        <div className="flex gap-2 flex-wrap">
          {selected.size > 0 && (
            <>
              <Button
                size="sm"
                className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                onClick={onInspectionRequest}
              >
                <Icon name="FileSearch" size={12} className="mr-1" /> Заявка на досмотр ({selected.size})
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCopySelected}>
                <Icon name="Copy" size={12} className="mr-1" /> Копировать ({selected.size})
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onMoveSelected}>
                <Icon name="ArrowRightLeft" size={12} className="mr-1" /> В рейс
              </Button>
              <Button
                variant="outline" size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/5"
                onClick={onDeleteSelected}
              >
                <Icon name="Trash2" size={12} className="mr-1" /> Удалить ({selected.size})
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClearSelected}>
                Снять выделение
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}