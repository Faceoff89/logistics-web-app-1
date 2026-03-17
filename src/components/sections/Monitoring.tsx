import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { monitoringApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface TempContainer {
  id: string;
  container_number: string;
  load_temp: string;
  note: string;
  sort_order: number;
  records: Record<string, string>;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }).replace('.', '.');
}

function getTodayIso(): string {
  return formatDate(new Date());
}

function getLastDates(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

function getTempColor(val: string): string {
  if (!val || val.trim() === '') return '';
  const low = val.toLowerCase();
  if (low === 'отл') return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
  const num = parseFloat(val.replace(',', '.').replace(/[^0-9.\-+]/g, ''));
  if (isNaN(num)) return '';
  if (num > 0) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold';
  return '';
}

// ── Форма механика ────────────────────────────────────────────────────────────

interface MechanicFormProps {
  containers: TempContainer[];
  onSaved: () => void;
}

function MechanicForm({ containers, onSaved }: MechanicFormProps) {
  const today = getTodayIso();
  const [date, setDate] = useState(today);
  const [temps, setTemps] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const c of containers) {
      initial[c.id] = c.records[date] ?? '';
    }
    setTemps(initial);
    setSaved(false);
  }, [date, containers]);

  const handleSave = async () => {
    setSaving(true);
    const entries = containers.map(c => ({ container_id: c.id, temperature: temps[c.id] ?? '' }));
    await monitoringApi.bulkSetTemperatures(date, entries);
    setSaving(false);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 3000);
  };

  const filledCount = Object.values(temps).filter(v => v.trim() !== '').length;

  return (
    <div className="bg-card border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold">Ввод температур</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Заполните показания за выбранную дату</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Дата:</label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-40 h-8 text-sm"
            />
          </div>
          <div className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-1">
            {filledCount} / {containers.length} заполнено
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {containers.map((c, idx) => (
          <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border bg-background hover:bg-accent/30 transition-colors">
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.container_number}</p>
              {c.load_temp && (
                <p className="text-xs text-muted-foreground">Погр: {c.load_temp}</p>
              )}
            </div>
            <Input
              value={temps[c.id] ?? ''}
              onChange={e => setTemps(prev => ({ ...prev, [c.id]: e.target.value }))}
              placeholder="—"
              className={cn(
                'w-20 h-8 text-sm text-center',
                temps[c.id] && getTempColor(temps[c.id]),
              )}
            />
          </div>
        ))}
      </div>

      {containers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Нет контейнеров. Добавьте их в разделе «Таблица».
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {saved && <span className="text-green-600 font-medium">Сохранено!</span>}
        </p>
        <Button onClick={handleSave} disabled={saving || containers.length === 0} className="gap-2">
          <Icon name={saving ? 'Loader2' : 'Save'} size={15} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}

// ── Сводная таблица ────────────────────────────────────────────────────────────

interface SummaryTableProps {
  containers: TempContainer[];
  dates: string[];
  onEdit: (c: TempContainer) => void;
  onDelete: (id: string) => void;
  canManage: boolean;
}

function SummaryTable({ containers, dates, onEdit, onDelete, canManage }: SummaryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="min-w-max w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1a5276] text-white">
            <th className="px-3 py-2.5 text-center font-semibold border-r border-white/20 w-10">№</th>
            <th className="px-3 py-2.5 text-left font-semibold border-r border-white/20 min-w-[160px]">№ контейнера</th>
            <th className="px-3 py-2.5 text-center font-semibold border-r border-white/20 w-28">Погр. Темп.</th>
            {dates.map(d => (
              <th key={d} className="px-3 py-2.5 text-center font-semibold border-r border-white/20 w-24">
                {formatDateLabel(d)}
              </th>
            ))}
            <th className="px-3 py-2.5 text-left font-semibold border-r border-white/20 min-w-[140px]">Примечание</th>
            {canManage && <th className="px-2 py-2.5 w-16"></th>}
          </tr>
        </thead>
        <tbody>
          {containers.map((c, idx) => (
            <tr key={c.id} className={cn('border-t hover:bg-accent/30 transition-colors', idx % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
              <td className="px-3 py-2 text-center text-muted-foreground border-r">{idx + 1}</td>
              <td className="px-3 py-2 font-medium border-r">{c.container_number}</td>
              <td className={cn('px-3 py-2 text-center border-r', c.load_temp ? getTempColor(c.load_temp) || 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' : '')}>
                {c.load_temp || ''}
              </td>
              {dates.map(d => (
                <td key={d} className={cn('px-3 py-2 text-center border-r', getTempColor(c.records[d] || ''))}>
                  {c.records[d] || ''}
                </td>
              ))}
              <td className="px-3 py-2 text-muted-foreground border-r text-xs">{c.note || ''}</td>
              {canManage && (
                <td className="px-2 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(c)}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon name="Pencil" size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {containers.length === 0 && (
            <tr>
              <td colSpan={dates.length + 4 + (canManage ? 1 : 0)} className="text-center py-10 text-muted-foreground text-sm">
                Нет контейнеров для отображения
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Модалка контейнера ─────────────────────────────────────────────────────────

interface ContainerModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Partial<TempContainer> | null;
  onSave: (data: { container_number: string; load_temp: string; note: string }) => Promise<void>;
}

function ContainerModal({ open, onOpenChange, initial, onSave }: ContainerModalProps) {
  const [num, setNum] = useState('');
  const [loadTemp, setLoadTemp] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNum(initial?.container_number ?? '');
      setLoadTemp(initial?.load_temp ?? '');
      setNote(initial?.note ?? '');
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!num.trim()) return;
    setSaving(true);
    await onSave({ container_number: num.trim(), load_temp: loadTemp.trim(), note: note.trim() });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Редактировать контейнер' : 'Добавить контейнер'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">№ контейнера *</label>
            <Input value={num} onChange={e => setNum(e.target.value)} placeholder="МВКУ 3528169" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Погрузочная температура</label>
            <Input value={loadTemp} onChange={e => setLoadTemp(e.target.value)} placeholder="-24" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Примечание</label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="..." className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving || !num.trim()}>
            {saving ? 'Сохраняю...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Главный компонент ──────────────────────────────────────────────────────────

export default function Monitoring() {
  const { currentUser } = useAppStore();
  const isMechanic = currentUser?.role === 'mechanic';
  const canManage = !isMechanic;

  const [containers, setContainers] = useState<TempContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState<'mechanic' | 'summary'>(isMechanic ? 'mechanic' : 'summary');
  const [modalOpen, setModalOpen] = useState(false);
  const [editContainer, setEditContainer] = useState<TempContainer | null>(null);
  const [search, setSearch] = useState('');

  const dates = getLastDates(days);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await monitoringApi.getSummary(days);
    if (res?.containers) setContainers(res.containers);
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const filtered = containers.filter(c =>
    c.container_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveContainer = async (data: { container_number: string; load_temp: string; note: string }) => {
    if (editContainer?.id) {
      await monitoringApi.updateContainer(editContainer.id, data);
    } else {
      await monitoringApi.addContainer(data);
    }
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить контейнер из мониторинга?')) return;
    await monitoringApi.deleteContainer(id);
    await load();
  };

  const openEdit = (c: TempContainer) => {
    setEditContainer(c);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditContainer(null);
    setModalOpen(true);
  };

  const today = new Date();
  const pikDate = today.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Мониторинг температур</h1>
          <p className="text-sm text-muted-foreground mt-0.5">ПИК — {pikDate}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <>
              <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted">
                {[7, 14, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                      days === d ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {d} дн.
                  </button>
                ))}
              </div>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск контейнера..."
                className="w-44 h-8 text-sm"
              />
              <Button size="sm" onClick={openAdd} className="gap-1.5">
                <Icon name="Plus" size={14} />
                Добавить
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
            <Icon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
            Обновить
          </Button>
        </div>
      </div>

      {isMechanic && (
        <div className="flex gap-1 border-b">
          {[
            { key: 'mechanic', label: 'Ввод данных', icon: 'Thermometer' },
            { key: 'summary', label: 'Сводная таблица', icon: 'Table2' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'mechanic' | 'summary')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Icon name="Loader2" size={18} className="animate-spin" />
          <span className="text-sm">Загрузка...</span>
        </div>
      ) : (
        <>
          {(tab === 'mechanic' && isMechanic) && (
            <MechanicForm containers={containers} onSaved={load} />
          )}

          {(tab === 'summary' || !isMechanic) && (
            <SummaryTable
              containers={filtered}
              dates={dates}
              onEdit={openEdit}
              onDelete={handleDelete}
              canManage={canManage}
            />
          )}
        </>
      )}

      <ContainerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editContainer}
        onSave={handleSaveContainer}
      />
    </div>
  );
}
