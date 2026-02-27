import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import {
  ArrivalShipment, ArrivalStatus, ARRIVAL_STATUS_LABEL,
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

const COLS = [
  { key: 'railSendDate', label: 'Дата отправки по ж.д.', w: '140px' },
  { key: 'stationFrom', label: 'Станция отправления', w: '160px' },
  { key: 'container', label: 'Контейнер', w: '130px' },
  { key: 'terminalUnloadDate', label: 'Дата выгрузки на терминал', w: '160px' },
  { key: 'vsd', label: 'ВСД', w: '120px' },
  { key: 'tempMode', label: 'Темпер', w: '80px' },
  { key: 'cargo', label: 'Груз', w: '140px' },
  { key: 'consignee', label: 'Грузополучатель', w: '160px' },
  { key: 'destinationCity', label: 'Город назначения', w: '140px' },
  { key: 'clientNotifyDate', label: 'Дата оповещения клиента', w: '155px' },
  { key: 'inspectionDate', label: 'Дата досмотра', w: '130px' },
  { key: 'exportDate', label: 'Дата вывоза', w: '120px' },
  { key: 'exportBan', label: 'Запрет на выдачу', w: '130px' },
  { key: 'comment', label: 'Комментарий', w: '180px' },
  { key: 'unloadAddress', label: 'Адрес выгрузки', w: '200px' },
  { key: 'scep', label: 'СЦЕП', w: '100px' },
  { key: 'scepDate', label: 'Дата сцепа', w: '120px' },
  { key: 'customer', label: 'Кастомер', w: '140px' },
  { key: 'manager', label: 'Менеджер', w: '140px' },
  { key: 'cargoWeight', label: 'Вес груза', w: '100px' },
  { key: 'cdekArrivalKey', label: 'CDEK (прибытие для ключевых ГП)', w: '200px' },
  { key: 'cdekTrack', label: 'CDEK', w: '130px' },
  { key: 'documents', label: 'Документы', w: '140px' },
  { key: 'status', label: 'Статус', w: '120px' },
] as const;

const STATUS_COLORS: Record<ArrivalStatus, string> = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  arrived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  unloaded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  issued: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const ROW_COLORS: Record<ArrivalStatus, string> = {
  planned: '',
  arrived: 'bg-yellow-50/60 dark:bg-yellow-900/10',
  unloaded: 'bg-purple-50/60 dark:bg-purple-900/10',
  issued: 'bg-green-50/60 dark:bg-green-900/10',
};

const EMPTY: Omit<ArrivalShipment, 'id'> = {
  railSendDate: '',
  stationFrom: '',
  container: '',
  terminalUnloadDate: '',
  vsd: '',
  tempMode: '',
  cargo: '',
  consignee: '',
  destinationCity: '',
  clientNotifyDate: '',
  inspectionDate: '',
  exportDate: '',
  exportBan: '',
  comment: '',
  unloadAddress: '',
  scep: '',
  scepDate: '',
  customer: '',
  manager: '',
  cargoWeight: '',
  cdekArrivalKey: '',
  cdekTrack: '',
  documents: '',
  status: 'planned',
};

export default function PlanningArrival() {
  const { arrivalShipments, addArrivalShipment, updateArrivalShipment, deleteManyArrivalShipments } = useAppStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ArrivalShipment | null>(null);
  const [formData, setFormData] = useState<Omit<ArrivalShipment, 'id'>>(EMPTY);

  const filtered = useMemo(() => {
    return arrivalShipments
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .filter(r => !filterDate || r.railSendDate === filterDate || r.terminalUnloadDate === filterDate)
      .filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.container.toLowerCase().includes(q) ||
          r.cargo.toLowerCase().includes(q) ||
          r.consignee.toLowerCase().includes(q) ||
          r.destinationCity.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.manager.toLowerCase().includes(q) ||
          r.stationFrom.toLowerCase().includes(q)
        );
      });
  }, [arrivalShipments, filterStatus, filterDate, search]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  }

  function handleDeleteSelected() {
    deleteManyArrivalShipments([...selected]);
    setSelected(new Set());
  }

  function openAdd() {
    setEditItem(null);
    setFormData(EMPTY);
    setModalOpen(true);
  }

  function openEdit(item: ArrivalShipment) {
    setEditItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  }

  function handleSave() {
    if (editItem) {
      updateArrivalShipment(editItem.id, formData);
    } else {
      addArrivalShipment({ ...formData, id: `arr${Date.now()}` });
    }
    setModalOpen(false);
  }

  function handleInlineEdit(id: string, key: keyof ArrivalShipment, val: string) {
    updateArrivalShipment(id, { [key]: val } as Partial<ArrivalShipment>);
  }

  function exportCSV() {
    const headers = COLS.map(c => c.label).join(';');
    const rows = filtered.map(r =>
      COLS.map(c => {
        const val = r[c.key as keyof ArrivalShipment] ?? '';
        if (c.key === 'status') return ARRIVAL_STATUS_LABEL[r.status];
        return String(val).replace(/;/g, ',');
      }).join(';')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-arrival-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const f = (key: keyof Omit<ArrivalShipment, 'id'>, label: string, type = 'text') => (
    <div key={key} className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {key === 'status' ? (
        <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as ArrivalStatus }))}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ARRIVAL_STATUS_LABEL) as ArrivalStatus[]).map(s => (
              <SelectItem key={s} value={s}>{ARRIVAL_STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={type}
          value={formData[key] as string}
          onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
          className="h-8 text-sm"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Планирование ПРИБЫТИЕ</h1>
          <p className="text-sm text-muted-foreground">Учёт прибывающих грузов по железной дороге</p>
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

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Поиск по контейнеру, грузу, грузополучателю..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm w-72"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {(Object.keys(ARRIVAL_STATUS_LABEL) as ArrivalStatus[]).map(s => (
              <SelectItem key={s} value={s}>{ARRIVAL_STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="h-8 text-sm w-40"
        />
        {filterDate && (
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setFilterDate('')}>
            <Icon name="X" size={14} />
          </Button>
        )}
        {selected.size > 0 && (
          <Button variant="destructive" size="sm" className="h-8 ml-auto" onClick={handleDeleteSelected}>
            <Icon name="Trash2" size={14} className="mr-1" /> Удалить ({selected.size})
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} записей</span>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '3000px' }}>
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="w-8 px-2 py-2 text-left sticky left-0 bg-muted/60 z-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                {COLS.map(col => (
                  <th
                    key={col.key}
                    className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap text-xs"
                    style={{ minWidth: col.w }}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLS.length + 2} className="text-center py-10 text-muted-foreground text-sm">
                    Нет записей. Нажмите «Добавить запись» чтобы начать.
                  </td>
                </tr>
              )}
              {filtered.map(row => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/30 transition-colors group',
                    ROW_COLORS[row.status],
                    selected.has(row.id) && 'bg-primary/5',
                  )}
                >
                  <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  {COLS.map(col => (
                    <td key={col.key} className="px-2 py-1.5 align-middle" style={{ minWidth: col.w }}>
                      {col.key === 'status' ? (
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[row.status])}>
                          {ARRIVAL_STATUS_LABEL[row.status]}
                        </span>
                      ) : col.key === 'exportBan' && row.exportBan ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          {row.exportBan}
                        </span>
                      ) : (
                        <input
                          className="w-full bg-transparent outline-none focus:bg-background focus:border focus:border-primary/30 rounded px-1 py-0.5 text-xs min-w-[60px]"
                          value={row[col.key as keyof ArrivalShipment] as string ?? ''}
                          onChange={e => handleInlineEdit(row.id, col.key as keyof ArrivalShipment, e.target.value)}
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(row)}
                    >
                      <Icon name="Pencil" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Редактировать запись' : 'Новая запись прибытия'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {f('railSendDate', 'Дата отправки по ж.д.', 'date')}
            {f('stationFrom', 'Станция отправления')}
            {f('container', 'Контейнер')}
            {f('terminalUnloadDate', 'Дата выгрузки на терминал', 'date')}
            {f('vsd', 'ВСД')}
            {f('tempMode', 'Температура')}
            {f('cargo', 'Груз')}
            {f('consignee', 'Грузополучатель')}
            {f('destinationCity', 'Город назначения')}
            {f('clientNotifyDate', 'Дата оповещения клиента', 'date')}
            {f('inspectionDate', 'Дата досмотра', 'date')}
            {f('exportDate', 'Дата вывоза', 'date')}
            {f('exportBan', 'Запрет на выдачу')}
            {f('unloadAddress', 'Адрес выгрузки')}
            {f('scep', 'СЦЕП')}
            {f('scepDate', 'Дата сцепа', 'date')}
            {f('customer', 'Кастомер')}
            {f('manager', 'Менеджер')}
            {f('cargoWeight', 'Вес груза')}
            {f('cdekArrivalKey', 'CDEK (прибытие для ключевых ГП)')}
            {f('cdekTrack', 'CDEK')}
            {f('documents', 'Документы')}
            {f('status', 'Статус')}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Комментарий</label>
              <Input
                value={formData.comment}
                onChange={e => setFormData(p => ({ ...p, comment: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSave}>{editItem ? 'Сохранить' : 'Добавить'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
