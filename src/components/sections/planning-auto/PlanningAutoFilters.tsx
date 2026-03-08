import { AutoTask, AutoTaskType, AutoTaskStatus, AUTO_TASK_STATUS_LABEL } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TABS } from './constants';

interface PlanningAutoFiltersProps {
  autoTasks: AutoTask[];
  activeTab: AutoTaskType;
  search: string;
  filterStatus: string;
  filterDate: string;
  selected: Set<string>;
  filteredCount: number;
  onTabChange: (tab: AutoTaskType) => void;
  onSearchChange: (v: string) => void;
  onFilterStatusChange: (v: string) => void;
  onFilterDateChange: (v: string) => void;
  onDeleteSelected: () => void;
  onClearSelected: () => void;
  onExportCSV: () => void;
  onAdd: () => void;
}

export function PlanningAutoFilters({
  autoTasks,
  activeTab,
  search,
  filterStatus,
  filterDate,
  selected,
  filteredCount,
  onTabChange,
  onSearchChange,
  onFilterStatusChange,
  onFilterDateChange,
  onDeleteSelected,
  onClearSelected,
  onExportCSV,
  onAdd,
}: PlanningAutoFiltersProps) {
  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Планирование АВТО</h1>
          <p className="text-sm text-muted-foreground">Управление автоперевозками: перемещение, погрузка, выгрузка</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <Icon name="Download" size={14} className="mr-1" /> Экспорт CSV
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Icon name="Plus" size={14} className="mr-1" /> Добавить запись
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => onTabChange(tab.type)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border',
              activeTab === tab.type
                ? `${tab.color} text-white border-transparent shadow-md`
                : 'bg-background border-border text-muted-foreground hover:bg-accent',
            )}
          >
            <Icon name={tab.icon} size={16} />
            {tab.label}
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded text-xs font-bold',
              activeTab === tab.type ? 'bg-white/20' : 'bg-muted',
            )}>
              {autoTasks.filter(t => t.type === tab.type).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по контейнеру, клиенту..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 w-56 h-8 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {(Object.keys(AUTO_TASK_STATUS_LABEL) as AutoTaskStatus[]).map(s => (
              <SelectItem key={s} value={s}>{AUTO_TASK_STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDate}
          onChange={e => onFilterDateChange(e.target.value)}
          className="h-8 text-sm w-36"
        />
        {filterDate && (
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onFilterDateChange('')}>
            <Icon name="X" size={14} />
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredCount} записей
        </span>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">Выбрано: {selected.size}</span>
          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={onDeleteSelected}>
            <Icon name="Trash2" size={12} className="mr-1" /> Удалить ({selected.size})
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={onClearSelected}>
            Снять выделение
          </Button>
        </div>
      )}
    </>
  );
}
