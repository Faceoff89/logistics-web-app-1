import { Shipment, Flight } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  COLS, STATUS_ROW_COLORS, calcDaysOnTerminal,
  EditableCell, StatusCell, ShipmentTypeCell, TerminalCell,
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
}

export function PlanningRailTable({
  filtered, flights, selected, dragId,
  onToggleSelect, onSelectAll, onDragStart, onDragEnd,
  onEdit, onCopy, onMoveOne,
  onCopySelected, onMoveSelected, onClearSelected, onDeleteSelected,
}: PlanningRailTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-max w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-8 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  className="rounded"
                  onChange={e => onSelectAll(e.target.checked)}
                />
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
              <tr>
                <td colSpan={COLS.length + 4} className="text-center py-10 text-muted-foreground">
                  Ничего не найдено
                </td>
              </tr>
            )}
            {filtered.map((s, idx) => {
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
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selected.has(s.id)}
                      onChange={() => onToggleSelect(s.id)}
                    />
                  </td>
                  {COLS.map(col => (
                    <td key={col.key} className={cn('px-3 py-2 text-foreground', col.width)}>
                      {col.key === 'number' ? (
                        <span className="text-muted-foreground font-medium">{idx + 1}</span>
                      ) : col.key === 'status' ? (
                        <StatusCell value={s.status} onChange={v => onEdit(s.id, 'status', v)} />
                      ) : col.key === 'shipmentType' ? (
                        <ShipmentTypeCell value={s.shipmentType} onChange={v => onEdit(s.id, 'shipmentType', v)} />
                      ) : col.key === 'terminal' ? (
                        <TerminalCell value={s.terminal} onChange={v => onEdit(s.id, 'terminal', v)} />
                      ) : (
                        <EditableCell
                          value={String(s[col.key] ?? '')}
                          onChange={v => onEdit(s.id, col.key, v)}
                          type={col.key.includes('Date') ? 'date' : 'text'}
                        />
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
                    {flight
                      ? <span className="text-[10px] text-muted-foreground whitespace-nowrap">{flight.number}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Копировать строку"
                        onClick={() => onCopy(s)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon name="Copy" size={13} />
                      </button>
                      <button
                        title="Переместить в рейс"
                        onClick={() => onMoveOne(s.id)}
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
          {selected.size > 0
            ? `Выбрано: ${selected.size} из ${filtered.length}`
            : `Всего: ${filtered.length} записей`}
        </span>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCopySelected}>
              <Icon name="Copy" size={12} className="mr-1" /> Копировать ({selected.size})
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onMoveSelected}>
              <Icon name="ArrowRightLeft" size={12} className="mr-1" /> Переместить в рейс
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
          </div>
        )}
      </div>
    </div>
  );
}