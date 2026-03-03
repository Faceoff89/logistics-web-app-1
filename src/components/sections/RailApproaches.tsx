import { useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';

export interface RailApproach {
  id: string;
  wagonNumber: string;
  wagonLength: string;
  dislocation: string;
  remainKm: string;
  arrivalDate: string;
  terminalDate: string;
  containerNumber: string;
  nextRepairDate: string;
  nextRepairType: string;
  note: string;
  terminal: string;
}

const EMPTY_ROW: Omit<RailApproach, 'id'> = {
  wagonNumber: '',
  wagonLength: '',
  dislocation: '',
  remainKm: '',
  arrivalDate: '',
  terminalDate: '',
  containerNumber: '',
  nextRepairDate: '',
  nextRepairType: '',
  note: '',
  terminal: '',
};

const COLUMNS: { key: keyof RailApproach; label: string; width: string }[] = [
  { key: 'wagonNumber',    label: '№ вагона',                       width: 'w-28' },
  { key: 'wagonLength',    label: 'Длина вагона (Ft)',              width: 'w-28' },
  { key: 'dislocation',    label: 'Дислокация',                     width: 'w-36' },
  { key: 'remainKm',       label: 'Осталось, км',                   width: 'w-28' },
  { key: 'arrivalDate',    label: 'Дата прибытия',                  width: 'w-36' },
  { key: 'terminalDate',   label: 'Дата подачи на терминал',        width: 'w-40' },
  { key: 'containerNumber',label: 'Номер контейнера',               width: 'w-36' },
  { key: 'nextRepairDate', label: 'Дата следующего планового ремонта', width: 'w-44' },
  { key: 'nextRepairType', label: 'Вид следующего планового ремонта',  width: 'w-44' },
  { key: 'note',           label: 'Примечание',                     width: 'w-44' },
  { key: 'terminal',       label: 'Терминал прибытия',              width: 'w-36' },
];

const DATE_KEYS: (keyof RailApproach)[] = ['arrivalDate', 'terminalDate', 'nextRepairDate'];

function isDate(key: keyof RailApproach) {
  return DATE_KEYS.includes(key);
}

const LS_KEY = 'rail_approaches_v1';

function load(): RailApproach[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(rows: RailApproach[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

function uid() {
  return `ra_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function RailApproaches() {
  const [rows, setRows] = useState<RailApproach[]>(load);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [filters, setFilters] = useState<Partial<Record<keyof RailApproach, string>>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RailApproach>>({});
  const [addModal, setAddModal] = useState(false);
  const [newRow, setNewRow] = useState<Omit<RailApproach, 'id'>>({ ...EMPTY_ROW });
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (next: RailApproach[]) => { setRows(next); save(next); };

  const active = useMemo(() => rows.filter(r => !r.terminalDate), [rows]);
  const done   = useMemo(() => rows.filter(r => !!r.terminalDate), [rows]);
  const source = tab === 'active' ? active : done;

  const filtered = useMemo(() => {
    return source.filter(r =>
      COLUMNS.every(col => {
        const f = filters[col.key]?.toLowerCase() ?? '';
        return !f || (r[col.key] ?? '').toLowerCase().includes(f);
      })
    );
  }, [source, filters]);

  const startEdit = (row: RailApproach) => {
    setEditId(row.id);
    setEditData({ ...row });
  };

  const saveEdit = () => {
    if (!editId) return;
    const next = rows.map(r => r.id === editId ? { ...r, ...editData } : r);
    update(next);
    setEditId(null);
    setEditData({});
  };

  const cancelEdit = () => { setEditId(null); setEditData({}); };

  const deleteRow = (id: string) => update(rows.filter(r => r.id !== id));

  const addRow = () => {
    if (!newRow.wagonNumber.trim()) return;
    update([...rows, { id: uid(), ...newRow }]);
    setNewRow({ ...EMPTY_ROW });
    setAddModal(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'dd.mm.yyyy' });
        if (data.length < 2) { setImportError('Файл пуст или нет данных'); return; }
        const imported: RailApproach[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[0]) continue;
          imported.push({
            id: uid(),
            wagonNumber:     String(row[0] ?? ''),
            wagonLength:     String(row[1] ?? ''),
            dislocation:     String(row[2] ?? ''),
            remainKm:        String(row[3] ?? ''),
            arrivalDate:     String(row[4] ?? ''),
            terminalDate:    String(row[5] ?? ''),
            containerNumber: String(row[6] ?? ''),
            nextRepairDate:  String(row[7] ?? ''),
            nextRepairType:  String(row[8] ?? ''),
            note:            String(row[9] ?? ''),
            terminal:        String(row[10] ?? ''),
          });
        }
        update([...rows, ...imported]);
      } catch {
        setImportError('Ошибка чтения файла');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const header = COLUMNS.map(c => c.label);
    const body = filtered.map(r => COLUMNS.map(c => r[c.key]));
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === 'active' ? 'В подходе' : 'Отработаны');
    XLSX.writeFile(wb, `подходы_жд_${tab === 'active' ? 'в_подходе' : 'отработаны'}.xlsx`);
  };

  const setFilter = (key: keyof RailApproach, val: string) =>
    setFilters(f => ({ ...f, [key]: val }));

  const rowColor = (row: RailApproach) => {
    if (row.arrivalDate) return 'bg-emerald-50 dark:bg-emerald-950/30';
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Подходы ЖД</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Всего в подходе: {active.length} · Отработано: {done.length}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Icon name="Plus" size={15} />
            Добавить
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm hover:bg-accent/50 transition-colors"
          >
            <Icon name="Upload" size={15} />
            Импорт Excel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm hover:bg-accent/50 transition-colors"
          >
            <Icon name="Download" size={15} />
            Экспорт Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {importError && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
          {importError}
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {(['active', 'done'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'active' ? 'В подходе' : 'Отработаны'}
            <span className="ml-2 text-xs bg-muted rounded-full px-1.5 py-0.5">
              {t === 'active' ? active.length : done.length}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-auto">
        <table className="text-xs min-w-max w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {COLUMNS.map(col => (
                <th key={col.key} className={cn('text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap', col.width)}>
                  {col.label}
                </th>
              ))}
              <th className="w-20 px-3 py-2 text-muted-foreground font-semibold">Действия</th>
            </tr>
            <tr className="border-b border-border">
              {COLUMNS.map(col => (
                <th key={col.key} className="px-2 py-1">
                  <input
                    value={filters[col.key] ?? ''}
                    onChange={e => setFilter(col.key, e.target.value)}
                    placeholder="Фильтр..."
                    className="w-full text-xs px-2 py-1 rounded border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="text-center py-10 text-muted-foreground">
                  {tab === 'active' ? 'Нет вагонов в подходе' : 'Нет отработанных'}
                </td>
              </tr>
            )}
            {filtered.map(row => (
              <tr
                key={row.id}
                className={cn('border-b border-border last:border-0 hover:bg-muted/20 transition-colors', rowColor(row))}
              >
                {COLUMNS.map(col => (
                  <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                    {editId === row.id ? (
                      <input
                        type={isDate(col.key) ? 'date' : 'text'}
                        value={editData[col.key] ?? ''}
                        onChange={e => setEditData(d => ({ ...d, [col.key]: e.target.value }))}
                        className="w-full text-xs px-2 py-1 rounded border border-primary bg-background focus:outline-none"
                      />
                    ) : (
                      <span className={cn(col.key === 'wagonNumber' && 'font-medium')}>
                        {row[col.key] || <span className="text-muted-foreground/40">—</span>}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {editId === row.id ? (
                      <>
                        <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700" title="Сохранить">
                          <Icon name="Check" size={14} />
                        </button>
                        <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground" title="Отмена">
                          <Icon name="X" size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(row)} className="text-muted-foreground hover:text-primary" title="Редактировать">
                          <Icon name="Pencil" size={14} />
                        </button>
                        <button onClick={() => deleteRow(row.id)} className="text-muted-foreground hover:text-red-500" title="Удалить">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Добавить вагон в подход</h3>
              <button onClick={() => setAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COLUMNS.map(col => (
                <div key={col.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{col.label}</label>
                  <input
                    type={isDate(col.key) ? 'date' : 'text'}
                    value={newRow[col.key as keyof typeof newRow]}
                    onChange={e => setNewRow(r => ({ ...r, [col.key]: e.target.value }))}
                    placeholder={col.label}
                    className="text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setAddModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 transition-colors">
                Отмена
              </button>
              <button
                onClick={addRow}
                disabled={!newRow.wagonNumber.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground">
        <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 mr-1 align-middle" />
        Зелёная строка — указана дата прибытия.
        Строка переходит во вкладку «Отработаны» при указании даты подачи на терминал.
      </div>
    </div>
  );
}
