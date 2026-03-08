import { AutoTask, AutoTaskType, AutoTaskStatus, AUTO_TASK_STATUS_LABEL } from '@/data/mock';
import { cn } from '@/lib/utils';
import { ColFilter } from '@/components/ui/col-filter';
import Icon from '@/components/ui/icon';
import { ColKey, STATUS_COLORS, ROW_COLORS, TABS, getColsForType } from './constants';

interface PlanningAutoTableProps {
  filtered: AutoTask[];
  activeTab: AutoTaskType;
  selected: Set<string>;
  colFilters: Record<string, string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onColFilterChange: (key: string, val: string) => void;
  onInlineEdit: (id: string, key: keyof AutoTask, val: string) => void;
  onEdit: (task: AutoTask) => void;
}

export function PlanningAutoTable({
  filtered,
  activeTab,
  selected,
  colFilters,
  onToggleSelect,
  onToggleAll,
  onColFilterChange,
  onInlineEdit,
  onEdit,
}: PlanningAutoTableProps) {
  const cols = getColsForType(activeTab);
  const currentTabInfo = TABS.find(t => t.type === activeTab)!;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className={cn('border-b border-border', currentTabInfo.color, 'text-white')}>
              <th className="w-9 px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={onToggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-2 py-2 text-left font-semibold text-xs w-8">#</th>
              {cols.map(col => (
                <th
                  key={col.key}
                  className="px-2 py-1.5 text-left font-semibold text-xs"
                  style={{ minWidth: col.w }}
                >
                  <div className="whitespace-nowrap mb-1">{col.label}</div>
                  <ColFilter
                    value={colFilters[col.key] || ''}
                    onChange={v => onColFilterChange(col.key, v)}
                    className="[&_input]:bg-white/20 [&_input]:placeholder:text-white/60 [&_input]:text-white [&_input]:border-white/30"
                  />
                </th>
              ))}
              <th className="px-2 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={cols.length + 3} className="text-center py-12 text-muted-foreground">
                  <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Нет записей</p>
                </td>
              </tr>
            )}
            {filtered.map((task, idx) => (
              <tr
                key={task.id}
                className={cn(
                  'border-b border-border last:border-0 transition-colors hover:bg-accent/40 group',
                  ROW_COLORS[task.status],
                  selected.has(task.id) && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
                )}
              >
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(task.id)}
                    onChange={() => onToggleSelect(task.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-2 py-1.5 text-xs text-muted-foreground">{idx + 1}</td>
                {cols.map(col => (
                  <td key={col.key} className="px-1 py-1" style={{ minWidth: col.w }}>
                    {col.key === 'status' ? (
                      <select
                        value={task.status}
                        onChange={e => onInlineEdit(task.id, 'status', e.target.value)}
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium border-0 cursor-pointer focus:outline-none',
                          STATUS_COLORS[task.status],
                        )}
                      >
                        {(Object.keys(AUTO_TASK_STATUS_LABEL) as AutoTaskStatus[]).map(s => (
                          <option key={s} value={s}>{AUTO_TASK_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.key === 'date' ? 'date' : 'text'}
                        value={(task[col.key as keyof AutoTask] as string) ?? ''}
                        onChange={e => onInlineEdit(task.id, col.key as keyof AutoTask, e.target.value)}
                        className="w-full bg-transparent text-xs px-1 py-0.5 rounded border border-transparent focus:border-primary/40 focus:bg-background focus:outline-none transition-colors"
                        style={{ minWidth: col.w }}
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Редактировать"
                    >
                      <Icon name="Pencil" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
