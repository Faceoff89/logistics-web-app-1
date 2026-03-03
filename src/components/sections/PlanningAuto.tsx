import { useState, useMemo, useEffect } from 'react';
import { ColFilter } from '@/components/ui/col-filter';
import { useAppStore } from '@/store/appStore';
import {
  AutoTask, AutoTaskType, AutoTaskStatus,
  AUTO_TASK_TYPE_LABEL, AUTO_TASK_STATUS_LABEL,
} from '@/data/mock';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const TABS: { type: AutoTaskType; label: string; icon: string; color: string }[] = [
  { type: 'movement', label: 'Перемещение', icon: 'ArrowLeftRight', color: 'bg-cyan-500' },
  { type: 'loading', label: 'Погрузка', icon: 'PackagePlus', color: 'bg-yellow-400' },
  { type: 'unloading', label: 'Выгрузка', icon: 'PackageMinus', color: 'bg-orange-400' },
];

const STATUS_COLORS: Record<AutoTaskStatus, string> = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
};

const ROW_COLORS: Record<AutoTaskStatus, string> = {
  planned: '',
  in_progress: 'bg-yellow-50/60 dark:bg-yellow-900/10',
  done: 'bg-green-50/60 dark:bg-green-900/10',
  cancelled: 'bg-red-50/40 dark:bg-red-900/10 opacity-60',
};

const MOVEMENT_COLS = [
  { key: 'date', label: 'Дата перемещения', w: '120px' },
  { key: 'direction', label: 'Направление', w: '160px' },
  { key: 'containerNumber', label: 'Номер КРК', w: '140px' },
  { key: 'carrier', label: 'Перевозчик', w: '140px' },
  { key: 'terminalFrom', label: 'Терминал постановки КРК', w: '160px' },
  { key: 'terminalTo', label: 'Терминал сдачи КРК', w: '160px' },
  { key: 'cargo', label: 'Груз', w: '120px' },
  { key: 'tempMode', label: 'тС', w: '60px' },
  { key: 'status', label: 'Статус', w: '130px' },
  { key: 'comment', label: 'Комментарий', w: '180px' },
] as const;

const LOADING_COLS = [
  { key: 'date', label: 'Дата погрузки', w: '120px' },
  { key: 'client', label: 'Клиент', w: '180px' },
  { key: 'containerNumber', label: '№ контейнера', w: '140px' },
  { key: 'carrier', label: 'Перевозчик', w: '140px' },
  { key: 'time', label: 'Время погрузки', w: '100px' },
  { key: 'address', label: 'Адрес погрузки', w: '220px' },
  { key: 'contact', label: 'Контакт на погрузке', w: '180px' },
  { key: 'terminalFrom', label: 'Терминал постановки КРК', w: '160px' },
  { key: 'terminalTo', label: 'Ст. отправления', w: '130px' },
  { key: 'direction', label: 'Ст. назначения', w: '130px' },
  { key: 'cargo', label: 'Груз', w: '120px' },
  { key: 'tempMode', label: 'тС', w: '60px' },
  { key: 'status', label: 'Статус', w: '130px' },
  { key: 'comment', label: 'Комментарий', w: '180px' },
] as const;

const UNLOADING_COLS = [
  { key: 'date', label: 'Дата выгрузки', w: '120px' },
  { key: 'client', label: 'Клиент', w: '180px' },
  { key: 'containerNumber', label: 'Номер КРК', w: '140px' },
  { key: 'carrier', label: 'Перевозчик', w: '140px' },
  { key: 'time', label: 'Время выгрузки', w: '100px' },
  { key: 'address', label: 'Адрес выгрузки', w: '220px' },
  { key: 'contact', label: 'Контакт на выгрузке', w: '180px' },
  { key: 'terminalFrom', label: 'Терминал постановки КРК', w: '160px' },
  { key: 'terminalTo', label: 'Терминал сдачи порожнего', w: '160px' },
  { key: 'status', label: 'Статус', w: '130px' },
  { key: 'comment', label: 'Комментарий', w: '180px' },
] as const;

type ColKey = string;

function getColsForType(type: AutoTaskType) {
  if (type === 'movement') return MOVEMENT_COLS as readonly { key: ColKey; label: string; w: string }[];
  if (type === 'loading') return LOADING_COLS as readonly { key: ColKey; label: string; w: string }[];
  return UNLOADING_COLS as readonly { key: ColKey; label: string; w: string }[];
}

const EMPTY_TASK = (type: AutoTaskType): Omit<AutoTask, 'id'> => ({
  type,
  date: new Date().toISOString().slice(0, 10),
  containerNumber: '',
  client: '',
  carrier: '',
  time: '',
  address: '',
  contact: '',
  terminalFrom: 'ПИК',
  terminalTo: '',
  cargo: '',
  tempMode: '',
  status: 'planned',
  comment: '',
  direction: '',
});

export default function PlanningAuto() {
  const { autoTasks, addAutoTask, updateAutoTask, deleteManyAutoTasks, currentUser } = useAppStore();

  const [activeTab, setActiveTab] = useState<AutoTaskType>('movement');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  useEffect(() => { setColFilters({}); }, [activeTab]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<AutoTask | null>(null);
  const [formData, setFormData] = useState<Omit<AutoTask, 'id'>>(EMPTY_TASK('movement'));

  const filtered = useMemo(() => {
    return autoTasks
      .filter(t => t.type === activeTab)
      .filter(t => filterStatus === 'all' || t.status === filterStatus)
      .filter(t => !filterDate || t.date === filterDate)
      .filter(t => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.containerNumber.toLowerCase().includes(q) ||
          t.client.toLowerCase().includes(q) ||
          t.carrier.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q) ||
          t.cargo.toLowerCase().includes(q) ||
          (t.direction || '').toLowerCase().includes(q)
        );
      })
      .filter(t => {
        for (const [key, val] of Object.entries(colFilters)) {
          if (!val) continue;
          if (!String(t[key as keyof AutoTask] ?? '').toLowerCase().includes(val.toLowerCase())) return false;
        }
        return true;
      });
  }, [autoTasks, activeTab, filterStatus, filterDate, search, colFilters]);

  const cols = getColsForType(activeTab);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(t => t.id)));
    }
  }

  function handleDeleteSelected() {
    deleteManyAutoTasks([...selected]);
    setSelected(new Set());
  }

  function openAdd() {
    setEditTask(null);
    setFormData(EMPTY_TASK(activeTab));
    setModalOpen(true);
  }

  function openEdit(task: AutoTask) {
    setEditTask(task);
    setFormData({ ...task });
    setModalOpen(true);
  }

  function handleSave() {
    if (editTask) {
      updateAutoTask(editTask.id, formData);
    } else {
      addAutoTask({ ...formData, id: `at${Date.now()}` });
    }
    setModalOpen(false);
  }

  function handleInlineEdit(id: string, key: keyof AutoTask, val: string) {
    updateAutoTask(id, { [key]: val } as Partial<AutoTask>);
  }

  function exportCSV() {
    const headers = cols.map(c => c.label).join(';');
    const rows = filtered.map(t =>
      cols.map(c => {
        const val = t[c.key as keyof AutoTask] ?? '';
        if (c.key === 'status') return AUTO_TASK_STATUS_LABEL[t.status];
        return String(val).replace(/;/g, ',');
      }).join(';')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-auto-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentTabInfo = TABS.find(t => t.type === activeTab)!;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Планирование АВТО</h1>
          <p className="text-sm text-muted-foreground">Управление автоперевозками: перемещение, погрузка, выгрузка</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Icon name="Download" size={14} className="mr-1" /> Экспорт CSV
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Icon name="Plus" size={14} className="mr-1" /> Добавить запись
          </Button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => { setActiveTab(tab.type); setSelected(new Set()); }}
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

      {/* Фильтры */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по контейнеру, клиенту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 w-56 h-8 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
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
          onChange={e => setFilterDate(e.target.value)}
          className="h-8 text-sm w-36"
        />
        {filterDate && (
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setFilterDate('')}>
            <Icon name="X" size={14} />
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} записей
        </span>
      </div>

      {/* Bulk-панель */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">Выбрано: {selected.size}</span>
          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleDeleteSelected}>
            <Icon name="Trash2" size={12} className="mr-1" /> Удалить ({selected.size})
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => setSelected(new Set())}>
            Снять выделение
          </Button>
        </div>
      )}

      {/* Таблица */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className={cn('border-b border-border', currentTabInfo.color, 'text-white')}>
                <th className="w-9 px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
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
                      onChange={v => setColFilters(p => ({ ...p, [col.key]: v }))}
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
                      onChange={() => toggleSelect(task.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-xs text-muted-foreground">{idx + 1}</td>
                  {cols.map(col => (
                    <td key={col.key} className="px-1 py-1" style={{ minWidth: col.w }}>
                      {col.key === 'status' ? (
                        <select
                          value={task.status}
                          onChange={e => handleInlineEdit(task.id, 'status', e.target.value)}
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
                          onChange={e => handleInlineEdit(task.id, col.key as keyof AutoTask, e.target.value)}
                          className="w-full bg-transparent text-xs px-1 py-0.5 rounded border border-transparent focus:border-primary/40 focus:bg-background focus:outline-none transition-colors"
                          style={{ minWidth: col.w }}
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(task)}
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

      {/* Модальное окно добавления/редактирования */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTask ? 'Редактировать запись' : `Добавить — ${AUTO_TASK_TYPE_LABEL[activeTab]}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <FormField label="Дата" required>
              <Input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
            </FormField>
            <FormField label="Тип">
              <Select value={formData.type} onValueChange={v => setFormData(f => ({ ...f, type: v as AutoTaskType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TABS.map(t => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Номер контейнера" required>
              <Input placeholder="AVGU7003537" value={formData.containerNumber} onChange={e => setFormData(f => ({ ...f, containerNumber: e.target.value }))} />
            </FormField>
            <FormField label="Перевозчик">
              <Input placeholder="ИП Нагель" value={formData.carrier} onChange={e => setFormData(f => ({ ...f, carrier: e.target.value }))} />
            </FormField>
            {formData.type !== 'movement' && (
              <FormField label="Клиент" className="col-span-2">
                <Input placeholder="ООО Викинг" value={formData.client} onChange={e => setFormData(f => ({ ...f, client: e.target.value }))} />
              </FormField>
            )}
            <FormField label="Время">
              <Input placeholder="9:00" value={formData.time} onChange={e => setFormData(f => ({ ...f, time: e.target.value }))} />
            </FormField>
            <FormField label="Статус">
              <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v as AutoTaskStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(AUTO_TASK_STATUS_LABEL) as AutoTaskStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{AUTO_TASK_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Адрес" className="col-span-2">
              <Input placeholder="г. Артём, ул. 1я Рабочая, 83" value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} />
            </FormField>
            <FormField label="Контакт" className="col-span-2">
              <Input placeholder="8 914 07 50 545 Алеся" value={formData.contact} onChange={e => setFormData(f => ({ ...f, contact: e.target.value }))} />
            </FormField>
            <FormField label="Терминал постановки КРК">
              <Input placeholder="ПИК" value={formData.terminalFrom} onChange={e => setFormData(f => ({ ...f, terminalFrom: e.target.value }))} />
            </FormField>
            <FormField label={formData.type === 'movement' ? 'Терминал сдачи КРК' : formData.type === 'loading' ? 'Ст. отправления' : 'Терминал сдачи порожнего'}>
              <Input placeholder="ВМТП" value={formData.terminalTo} onChange={e => setFormData(f => ({ ...f, terminalTo: e.target.value }))} />
            </FormField>
            {(formData.type === 'movement' || formData.type === 'loading') && (
              <FormField label={formData.type === 'movement' ? 'Направление' : 'Ст. назначения'}>
                <Input placeholder="Москва" value={formData.direction ?? ''} onChange={e => setFormData(f => ({ ...f, direction: e.target.value }))} />
              </FormField>
            )}
            <FormField label="Груз">
              <Input placeholder="Мясо птицы" value={formData.cargo} onChange={e => setFormData(f => ({ ...f, cargo: e.target.value }))} />
            </FormField>
            <FormField label="Температура (тС)">
              <Input placeholder="-18" value={formData.tempMode} onChange={e => setFormData(f => ({ ...f, tempMode: e.target.value }))} />
            </FormField>
            <FormField label="Комментарий" className="col-span-2">
              <Input placeholder="Комментарий..." value={formData.comment} onChange={e => setFormData(f => ({ ...f, comment: e.target.value }))} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={!formData.containerNumber || !formData.date}>
              {editTask ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}