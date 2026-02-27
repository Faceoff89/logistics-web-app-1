import { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAppStore } from '@/store/appStore';
import { Equipment as Eq, EquipmentStatus, ContainerType, TERMINALS, EQUIPMENT_STATUS_LABEL } from '@/data/mock';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const POWER_TYPES: Record<string, string> = { dgk: 'ДГК', egk: 'ЭГК', ndgu: 'НДГУ' };

const STATUS_COLORS: Record<EquipmentStatus, string> = {
  checked: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  unchecked: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  broken: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function TerminalInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState(!TERMINALS.includes(value));
  const selectVal = custom ? '__custom__' : value;

  return (
    <div className="space-y-2">
      <Select
        value={selectVal}
        onValueChange={v => {
          if (v === '__custom__') { setCustom(true); onChange(''); }
          else { setCustom(false); onChange(v); }
        }}
      >
        <SelectTrigger><SelectValue placeholder="Выберите терминал" /></SelectTrigger>
        <SelectContent>
          {TERMINALS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          <SelectItem value="__custom__">— Ввести свой —</SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Название терминала" autoFocus />
      )}
    </div>
  );
}

function parseContainersXlsx(file: File): Promise<Partial<Eq>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
        const result = rows
          .filter(r => r['Номер'] || r['номер'] || r['number'] || Object.values(r)[0])
          .map(r => {
            const num = (r['Номер'] || r['номер'] || r['number'] || String(Object.values(r)[0] ?? '')).toString().trim().toUpperCase();
            const statusRaw = (r['Статус'] || r['статус'] || r['status'] || '').toString().toLowerCase();
            const status: EquipmentStatus = statusRaw.includes('испр') || statusRaw === 'broken' ? 'broken'
              : statusRaw.includes('провер') || statusRaw === 'checked' ? 'checked' : 'unchecked';
            const location = (r['Терминал'] || r['терминал'] || r['location'] || TERMINALS[0]).toString().trim() || TERMINALS[0];
            const comment = (r['Комментарий'] || r['комментарий'] || r['comment'] || '').toString().trim();
            return { number: num, status, location, comment, type: 'container' as ContainerType };
          })
          .filter(r => r.number);
        resolve(result);
      } catch { reject(new Error('Не удалось прочитать файл')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsArrayBuffer(file);
  });
}

function parseEnergyXlsx(file: File): Promise<Partial<Eq>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
        const result = rows
          .filter(r => r['Номер'] || r['номер'] || r['number'] || Object.values(r)[0])
          .map(r => {
            const num = (r['Номер'] || r['номер'] || r['number'] || String(Object.values(r)[0] ?? '')).toString().trim().toUpperCase();
            const typeRaw = (r['Тип'] || r['тип'] || r['type'] || 'ДГК').toString().toUpperCase();
            const type: ContainerType = typeRaw.includes('ЭГК') || typeRaw === 'EGK' ? 'egk'
              : typeRaw.includes('НДГУ') || typeRaw === 'NDGU' ? 'ndgu' : 'dgk';
            const statusRaw = (r['Статус'] || r['статус'] || r['status'] || '').toString().toLowerCase();
            const status: EquipmentStatus = statusRaw.includes('испр') || statusRaw === 'broken' ? 'broken'
              : statusRaw.includes('провер') || statusRaw === 'checked' ? 'checked' : 'unchecked';
            const location = (r['Терминал'] || r['терминал'] || r['location'] || TERMINALS[0]).toString().trim() || TERMINALS[0];
            const comment = (r['Комментарий'] || r['комментарий'] || r['comment'] || '').toString().trim();
            return { number: num, type, status, location, comment };
          })
          .filter(r => r.number);
        resolve(result);
      } catch { reject(new Error('Не удалось прочитать файл')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate(type: 'containers' | 'energy') {
  const wb = XLSX.utils.book_new();
  const headers = type === 'containers'
    ? [['Номер', 'Статус', 'Терминал', 'Комментарий'],
       ['TCKU1234567', 'Проверен', 'ПИК', ''],
       ['CRXU9876543', 'Не проверен', 'ДТК', 'Требует осмотра'],
       ['MSCU1112223', 'Неисправен', 'Гамбург', 'Неисправен термостат']]
    : [['Номер', 'Тип', 'Статус', 'Терминал', 'Комментарий'],
       ['DGK-003', 'ДГК', 'Проверен', 'ПИК', ''],
       ['EGK-002', 'ЭГК', 'Не проверен', 'ДТК', ''],
       ['NDGU-003', 'НДГУ', 'Неисправен', 'Восточный', 'Замена аккумулятора']];
  const ws = XLSX.utils.aoa_to_sheet(headers);
  XLSX.utils.book_append_sheet(wb, ws, 'Шаблон');
  XLSX.writeFile(wb, type === 'containers' ? 'шаблон_контейнеры.xlsx' : 'шаблон_энергооборудование.xlsx');
}

// ── Вкладка: Контейнеры ──────────────────────────────────────────────────────

function ContainersTab() {
  const { equipment, updateEquipment, addEquipment, deleteEquipment, currentUser } = useAppStore();
  const containers = equipment.filter(e => e.type === 'container');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'all'>('all');
  const [filterTerminal, setFilterTerminal] = useState('all');
  const [addModal, setAddModal] = useState(false);
  const [newEq, setNewEq] = useState({ number: '', status: 'unchecked' as EquipmentStatus, location: TERMINALS[0], comment: '' });

  const [importModal, setImportModal] = useState(false);
  const [importRows, setImportRows] = useState<Partial<Eq>[]>([]);
  const [importError, setImportError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allTerminals = useMemo(() => {
    const custom = containers.map(e => e.location).filter(l => !TERMINALS.includes(l));
    return [...TERMINALS, ...Array.from(new Set(custom))];
  }, [containers]);

  const filtered = useMemo(() => containers.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.number.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || (e.comment || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchTerminal = filterTerminal === 'all' || e.location === filterTerminal;
    return matchSearch && matchStatus && matchTerminal;
  }), [containers, search, filterStatus, filterTerminal]);

  const terminalSummary = useMemo(() => {
    const map: Record<string, { total: number; checked: number; broken: number }> = {};
    for (const e of containers) {
      if (!map[e.location]) map[e.location] = { total: 0, checked: 0, broken: 0 };
      map[e.location].total++;
      if (e.status === 'checked') map[e.location].checked++;
      if (e.status === 'broken') map[e.location].broken++;
    }
    return map;
  }, [containers]);

  const handleUpdate = (id: string, data: Partial<Eq>) => {
    if (!currentUser) return;
    updateEquipment(id, data, currentUser.id, currentUser.name);
  };

  const handleAdd = () => {
    if (!newEq.number.trim()) return;
    addEquipment({
      id: `e${Date.now()}`,
      number: newEq.number.trim().toUpperCase(),
      type: 'container',
      status: newEq.status,
      location: newEq.location,
      lastCheck: new Date().toISOString().slice(0, 10),
      comment: newEq.comment,
    });
    setAddModal(false);
    setNewEq({ number: '', status: 'unchecked', location: TERMINALS[0], comment: '' });
  };

  const handleFileSelect = async (file: File) => {
    setImportError(''); setImportLoading(true);
    try {
      const rows = await parseContainersXlsx(file);
      if (!rows.length) setImportError('Файл не содержит данных. Проверьте заголовки колонок.');
      else setImportRows(rows);
    } catch (err: unknown) { setImportError(err instanceof Error ? err.message : 'Ошибка'); }
    setImportLoading(false);
  };

  const handleImportConfirm = () => {
    const today = new Date().toISOString().slice(0, 10);
    importRows.forEach((r, i) => {
      addEquipment({ id: `e${Date.now()}_${i}`, number: r.number!, type: 'container', status: r.status ?? 'unchecked', location: r.location ?? TERMINALS[0], lastCheck: today, comment: r.comment ?? '' });
    });
    setImportModal(false); setImportRows([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const checkedCount = containers.filter(e => e.status === 'checked').length;
  const brokenCount = containers.filter(e => e.status === 'broken').length;
  const uncheckedCount = containers.filter(e => e.status === 'unchecked').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {allTerminals.map(term => {
          const s = terminalSummary[term] ?? { total: 0, checked: 0, broken: 0 };
          if (!s.total) return null;
          return (
            <button
              key={term}
              onClick={() => setFilterTerminal(filterTerminal === term ? 'all' : term)}
              className={cn('rounded-xl border p-3 text-left transition-all hover:shadow-sm',
                filterTerminal === term ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:bg-accent/40')}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{term}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.total}</p>
              <div className="flex gap-2 mt-1 text-[11px]">
                <span className="text-emerald-600">{s.checked} ✓</span>
                {s.broken > 0 && <span className="text-red-500">{s.broken} ✗</span>}
              </div>
            </button>
          );
        })}
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Итого</p>
          <p className="text-2xl font-bold text-foreground mt-1">{containers.length}</p>
          <div className="flex gap-2 mt-1 text-[11px]">
            <span className="text-emerald-600">{checkedCount} ✓</span>
            <span className="text-amber-500">{uncheckedCount} ?</span>
            {brokenCount > 0 && <span className="text-red-500">{brokenCount} ✗</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-44">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по номеру..." className="pl-8 h-8 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as EquipmentStatus | 'all')}>
          <SelectTrigger className="w-38 h-8 text-sm"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(EQUIPMENT_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTerminal} onValueChange={setFilterTerminal}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="Терминал" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все терминалы</SelectItem>
            {allTerminals.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8" onClick={() => { setImportRows([]); setImportError(''); setImportModal(true); }}>
          <Icon name="FileSpreadsheet" size={14} className="mr-1.5" /> Добавить списком
        </Button>
        <Button size="sm" className="h-8" onClick={() => setAddModal(true)}>
          <Icon name="Plus" size={14} className="mr-1.5" /> Добавить
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['#', 'Номер контейнера', 'Статус', 'Терминал', 'Последняя проверка', 'Комментарий', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Icon name="Inbox" size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Нет контейнеров</p>
                </td></tr>
              )}
              {filtered.map((e, idx) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground tracking-wider">{e.number}</td>
                  <td className="px-4 py-2.5">
                    <select value={e.status} onChange={ev => handleUpdate(e.id, { status: ev.target.value as EquipmentStatus })}
                      className={cn('text-xs rounded-full px-2.5 py-0.5 border-0 outline-none cursor-pointer font-medium', STATUS_COLORS[e.status])}>
                      {Object.entries(EQUIPMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input value={e.location} onChange={ev => handleUpdate(e.id, { location: ev.target.value })}
                      className="text-sm bg-transparent outline-none text-foreground border-b border-transparent hover:border-muted-foreground/30 focus:border-primary transition-colors w-28" />
                  </td>
                  <td className="px-4 py-2.5">
                    <input type="date" defaultValue={e.lastCheck} onBlur={ev => handleUpdate(e.id, { lastCheck: ev.target.value })}
                      className="text-xs text-muted-foreground bg-transparent outline-none cursor-pointer hover:text-foreground" />
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <input defaultValue={e.comment} onBlur={ev => handleUpdate(e.id, { comment: ev.target.value })} placeholder="—"
                      className="bg-transparent outline-none w-full text-sm hover:border-b hover:border-muted-foreground/30 focus:border-b focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/30" />
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => deleteEquipment(e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Показано: {filtered.length} из {containers.length} контейнеров</span>
          <div className="flex gap-4 text-xs">
            <span className="text-emerald-600 font-medium">{checkedCount} проверено</span>
            <span className="text-amber-500 font-medium">{uncheckedCount} не проверено</span>
            {brokenCount > 0 && <span className="text-red-500 font-medium">{brokenCount} неисправно</span>}
          </div>
        </div>
      </div>

      {/* Добавить один */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Добавить контейнер</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Номер контейнера <span className="text-red-500">*</span></Label>
              <Input value={newEq.number} onChange={e => setNewEq({ ...newEq, number: e.target.value })} placeholder="TCKU3456789" className="font-mono uppercase" />
            </div>
            <div className="space-y-1">
              <Label>Статус</Label>
              <Select value={newEq.status} onValueChange={v => setNewEq({ ...newEq, status: v as EquipmentStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EQUIPMENT_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Терминал</Label>
              <TerminalInput value={newEq.location} onChange={v => setNewEq({ ...newEq, location: v })} />
            </div>
            <div className="space-y-1">
              <Label>Комментарий</Label>
              <Input value={newEq.comment} onChange={e => setNewEq({ ...newEq, comment: e.target.value })} placeholder="Необязательно" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAddModal(false)}>Отмена</Button>
            <Button onClick={handleAdd} disabled={!newEq.number.trim()}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Импорт Excel */}
      <Dialog open={importModal} onOpenChange={v => { setImportModal(v); if (!v) { setImportRows([]); setImportError(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Добавить контейнеры списком (Excel)</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Нет своего файла?</p>
                <p className="text-xs text-muted-foreground">Скачайте шаблон с примерами</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('containers')}>
                <Icon name="Download" size={14} className="mr-1.5" /> Скачать шаблон
              </Button>
            </div>

            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center space-y-3">
              <Icon name="FileSpreadsheet" size={32} className="mx-auto text-muted-foreground opacity-60" />
              <div>
                <p className="text-sm font-medium text-foreground">Загрузите файл Excel (.xlsx, .xls)</p>
                <p className="text-xs text-muted-foreground mt-1">Колонки: <span className="font-mono">Номер, Статус, Терминал, Комментарий</span></p>
                <p className="text-xs text-muted-foreground">Статус: «Проверен», «Не проверен», «Неисправен»</p>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importLoading}>
                <Icon name="Upload" size={14} className="mr-1.5" /> {importLoading ? 'Загрузка...' : 'Выбрать файл'}
              </Button>
            </div>

            {importError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">{importError}</div>
            )}

            {importRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Найдено записей: <span className="text-primary">{importRows.length}</span></p>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>{['Номер', 'Статус', 'Терминал', 'Комментарий'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {importRows.map((r, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-1.5 font-mono font-semibold">{r.number}</td>
                          <td className="px-3 py-1.5">{EQUIPMENT_STATUS_LABEL[r.status ?? 'unchecked']}</td>
                          <td className="px-3 py-1.5">{r.location}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{r.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setImportModal(false); setImportRows([]); setImportError(''); }}>Отмена</Button>
            <Button onClick={handleImportConfirm} disabled={importRows.length === 0}>
              Добавить {importRows.length > 0 ? importRows.length : ''} записей
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Вкладка: Энергообеспечение ────────────────────────────────────────────────

function EnergyTab() {
  const { equipment, updateEquipment, addEquipment, deleteEquipment, currentUser } = useAppStore();
  const energyItems = equipment.filter(e => e.type === 'dgk' || e.type === 'egk' || e.type === 'ndgu');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'all'>('all');
  const [filterTerminal, setFilterTerminal] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'dgk' | 'egk' | 'ndgu'>('all');
  const [addModal, setAddModal] = useState(false);
  const [newEq, setNewEq] = useState({ number: '', type: 'dgk' as 'dgk' | 'egk' | 'ndgu', status: 'unchecked' as EquipmentStatus, location: TERMINALS[0], comment: '' });

  const [importModal, setImportModal] = useState(false);
  const [importRows, setImportRows] = useState<Partial<Eq>[]>([]);
  const [importError, setImportError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allTerminals = useMemo(() => {
    const custom = energyItems.map(e => e.location).filter(l => !TERMINALS.includes(l));
    return [...TERMINALS, ...Array.from(new Set(custom))];
  }, [energyItems]);

  const filtered = useMemo(() => energyItems.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.number.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchTerminal = filterTerminal === 'all' || e.location === filterTerminal;
    const matchType = filterType === 'all' || e.type === filterType;
    return matchSearch && matchStatus && matchTerminal && matchType;
  }), [energyItems, search, filterStatus, filterTerminal, filterType]);

  const handleUpdate = (id: string, data: Partial<Eq>) => {
    if (!currentUser) return;
    updateEquipment(id, data, currentUser.id, currentUser.name);
  };

  const handleAdd = () => {
    if (!newEq.number.trim()) return;
    addEquipment({ id: `e${Date.now()}`, number: newEq.number.trim().toUpperCase(), type: newEq.type, status: newEq.status, location: newEq.location, lastCheck: new Date().toISOString().slice(0, 10), comment: newEq.comment });
    setAddModal(false);
    setNewEq({ number: '', type: 'dgk', status: 'unchecked', location: TERMINALS[0], comment: '' });
  };

  const handleFileSelect = async (file: File) => {
    setImportError(''); setImportLoading(true);
    try {
      const rows = await parseEnergyXlsx(file);
      if (!rows.length) setImportError('Файл не содержит данных. Проверьте заголовки колонок.');
      else setImportRows(rows);
    } catch (err: unknown) { setImportError(err instanceof Error ? err.message : 'Ошибка'); }
    setImportLoading(false);
  };

  const handleImportConfirm = () => {
    const today = new Date().toISOString().slice(0, 10);
    importRows.forEach((r, i) => {
      addEquipment({ id: `e${Date.now()}_${i}`, number: r.number!, type: r.type ?? 'dgk', status: r.status ?? 'unchecked', location: r.location ?? TERMINALS[0], lastCheck: today, comment: r.comment ?? '' });
    });
    setImportModal(false); setImportRows([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const dgkCount = energyItems.filter(e => e.type === 'dgk').length;
  const egkCount = energyItems.filter(e => e.type === 'egk').length;
  const ndguCount = energyItems.filter(e => e.type === 'ndgu').length;

  const terminalSummary = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of energyItems) map[e.location] = (map[e.location] ?? 0) + 1;
    return map;
  }, [energyItems]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">ДГК</p>
          <p className="text-3xl font-bold text-foreground">{dgkCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">ЭГК</p>
          <p className="text-3xl font-bold text-foreground">{egkCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">НДГУ</p>
          <p className="text-3xl font-bold text-foreground">{ndguCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-1">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 uppercase tracking-wide font-semibold">Проверено</p>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{energyItems.filter(e => e.status === 'checked').length}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 space-y-1">
          <p className="text-xs text-red-600 uppercase tracking-wide font-semibold">Неисправно</p>
          <p className="text-3xl font-bold text-red-600">{energyItems.filter(e => e.status === 'broken').length}</p>
        </div>
      </div>

      {Object.keys(terminalSummary).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(terminalSummary).map(([term, cnt]) => (
            <span key={term} className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {term}: <span className="text-foreground font-semibold">{cnt}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-44">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по номеру..." className="pl-8 h-8 text-sm" />
        </div>
        <Select value={filterType} onValueChange={v => setFilterType(v as 'all' | 'dgk' | 'egk' | 'ndgu')}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="Тип" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="dgk">ДГК</SelectItem>
            <SelectItem value="egk">ЭГК</SelectItem>
            <SelectItem value="ndgu">НДГУ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as EquipmentStatus | 'all')}>
          <SelectTrigger className="w-38 h-8 text-sm"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(EQUIPMENT_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTerminal} onValueChange={setFilterTerminal}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="Терминал" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все терминалы</SelectItem>
            {allTerminals.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8" onClick={() => { setImportRows([]); setImportError(''); setImportModal(true); }}>
          <Icon name="FileSpreadsheet" size={14} className="mr-1.5" /> Добавить списком
        </Button>
        <Button size="sm" className="h-8 ml-auto" onClick={() => setAddModal(true)}>
          <Icon name="Plus" size={14} className="mr-1.5" /> Добавить
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['#', 'Номер', 'Тип', 'Статус', 'Терминал', 'Последняя проверка', 'Комментарий', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Icon name="Inbox" size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Нет записей</p>
                </td></tr>
              )}
              {filtered.map((e, idx) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground tracking-wider">{e.number}</td>
                  <td className="px-4 py-2.5">
                    <select value={e.type} onChange={ev => handleUpdate(e.id, { type: ev.target.value as ContainerType })}
                      className="text-xs bg-transparent outline-none cursor-pointer text-foreground border rounded px-1.5 py-0.5 border-border">
                      <option value="dgk">ДГК</option>
                      <option value="egk">ЭГК</option>
                      <option value="ndgu">НДГУ</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select value={e.status} onChange={ev => handleUpdate(e.id, { status: ev.target.value as EquipmentStatus })}
                      className={cn('text-xs rounded-full px-2.5 py-0.5 border-0 outline-none cursor-pointer font-medium', STATUS_COLORS[e.status])}>
                      {Object.entries(EQUIPMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input value={e.location} onChange={ev => handleUpdate(e.id, { location: ev.target.value })}
                      className="text-sm bg-transparent outline-none text-foreground border-b border-transparent hover:border-muted-foreground/30 focus:border-primary transition-colors w-28" />
                  </td>
                  <td className="px-4 py-2.5">
                    <input type="date" defaultValue={e.lastCheck} onBlur={ev => handleUpdate(e.id, { lastCheck: ev.target.value })}
                      className="text-xs text-muted-foreground bg-transparent outline-none cursor-pointer hover:text-foreground" />
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <input defaultValue={e.comment} onBlur={ev => handleUpdate(e.id, { comment: ev.target.value })} placeholder="—"
                      className="bg-transparent outline-none w-full text-sm hover:border-b hover:border-muted-foreground/30 focus:border-b focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/30" />
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => deleteEquipment(e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">Показано: {filtered.length} из {energyItems.length} единиц</span>
        </div>
      </div>

      {/* Добавить один */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Добавить оборудование</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Номер <span className="text-red-500">*</span></Label>
              <Input value={newEq.number} onChange={e => setNewEq({ ...newEq, number: e.target.value })} placeholder="DGK-003" className="font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Тип</Label>
                <Select value={newEq.type} onValueChange={v => setNewEq({ ...newEq, type: v as 'dgk' | 'egk' | 'ndgu' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dgk">ДГК</SelectItem>
                    <SelectItem value="egk">ЭГК</SelectItem>
                    <SelectItem value="ndgu">НДГУ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Статус</Label>
                <Select value={newEq.status} onValueChange={v => setNewEq({ ...newEq, status: v as EquipmentStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EQUIPMENT_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Терминал</Label>
              <TerminalInput value={newEq.location} onChange={v => setNewEq({ ...newEq, location: v })} />
            </div>
            <div className="space-y-1">
              <Label>Комментарий</Label>
              <Input value={newEq.comment} onChange={e => setNewEq({ ...newEq, comment: e.target.value })} placeholder="Необязательно" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAddModal(false)}>Отмена</Button>
            <Button onClick={handleAdd} disabled={!newEq.number.trim()}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Импорт Excel */}
      <Dialog open={importModal} onOpenChange={v => { setImportModal(v); if (!v) { setImportRows([]); setImportError(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Добавить оборудование списком (Excel)</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Нет своего файла?</p>
                <p className="text-xs text-muted-foreground">Скачайте шаблон с примерами</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('energy')}>
                <Icon name="Download" size={14} className="mr-1.5" /> Скачать шаблон
              </Button>
            </div>

            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center space-y-3">
              <Icon name="FileSpreadsheet" size={32} className="mx-auto text-muted-foreground opacity-60" />
              <div>
                <p className="text-sm font-medium text-foreground">Загрузите файл Excel (.xlsx, .xls)</p>
                <p className="text-xs text-muted-foreground mt-1">Колонки: <span className="font-mono">Номер, Тип, Статус, Терминал, Комментарий</span></p>
                <p className="text-xs text-muted-foreground">Тип: «ДГК», «ЭГК», «НДГУ» · Статус: «Проверен», «Не проверен», «Неисправен»</p>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importLoading}>
                <Icon name="Upload" size={14} className="mr-1.5" /> {importLoading ? 'Загрузка...' : 'Выбрать файл'}
              </Button>
            </div>

            {importError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">{importError}</div>
            )}

            {importRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Найдено записей: <span className="text-primary">{importRows.length}</span></p>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>{['Номер', 'Тип', 'Статус', 'Терминал', 'Комментарий'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {importRows.map((r, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-1.5 font-mono font-semibold">{r.number}</td>
                          <td className="px-3 py-1.5">{POWER_TYPES[r.type ?? 'dgk']}</td>
                          <td className="px-3 py-1.5">{EQUIPMENT_STATUS_LABEL[r.status ?? 'unchecked']}</td>
                          <td className="px-3 py-1.5">{r.location}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{r.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setImportModal(false); setImportRows([]); setImportError(''); }}>Отмена</Button>
            <Button onClick={handleImportConfirm} disabled={importRows.length === 0}>
              Добавить {importRows.length > 0 ? importRows.length : ''} записей
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────

type EquipTab = 'containers' | 'energy';

export default function EquipmentSection() {
  const [tab, setTab] = useState<EquipTab>('containers');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Оборудование</h1>
          <p className="text-sm text-muted-foreground">Учёт рефрижераторных контейнеров и энергооборудования</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabButton active={tab === 'containers'} onClick={() => setTab('containers')} icon="Container">Контейнеры</TabButton>
        <TabButton active={tab === 'energy'} onClick={() => setTab('energy')} icon="Zap">Энергия</TabButton>
      </div>

      {tab === 'containers' && <ContainersTab />}
      {tab === 'energy' && <EnergyTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
      active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border')}>
      <Icon name={icon} size={15} />
      {children}
    </button>
  );
}
