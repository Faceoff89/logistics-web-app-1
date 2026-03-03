import { useState, useEffect, useCallback, useRef } from 'react';
import { dbApi, DirKey } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

type Row = Record<string, string>;

interface DirConfig {
  key: DirKey;
  label: string;
  icon: string;
  fields: { key: string; label: string; placeholder?: string }[];
  primaryField: string;
}

const DIRS: DirConfig[] = [
  {
    key: 'clients', label: 'Клиенты', icon: 'Building2', primaryField: 'name',
    fields: [
      { key: 'name', label: 'Название', placeholder: 'ООО Компания' },
      { key: 'inn', label: 'ИНН', placeholder: '1234567890' },
      { key: 'contact_person', label: 'Контактное лицо', placeholder: 'Иванов Иван' },
      { key: 'phone', label: 'Телефон', placeholder: '+7 (999) 000-00-00' },
      { key: 'email', label: 'Email', placeholder: 'info@company.ru' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'contractors', label: 'Подрядчики', icon: 'Handshake', primaryField: 'name',
    fields: [
      { key: 'name', label: 'Название', placeholder: 'ООО Подрядчик' },
      { key: 'type', label: 'Тип', placeholder: 'Перевозчик / Экспедитор' },
      { key: 'inn', label: 'ИНН', placeholder: '1234567890' },
      { key: 'contact_person', label: 'Контактное лицо', placeholder: 'Петров Петр' },
      { key: 'phone', label: 'Телефон', placeholder: '+7 (999) 000-00-00' },
      { key: 'email', label: 'Email', placeholder: 'info@company.ru' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'containers', label: 'Контейнеры', icon: 'Container', primaryField: 'number',
    fields: [
      { key: 'number', label: 'Номер', placeholder: 'TCKU1234567' },
      { key: 'size', label: 'Размер', placeholder: '40HC' },
      { key: 'owner', label: 'Владелец', placeholder: '' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'vehicles', label: 'Авто', icon: 'Truck', primaryField: 'plate',
    fields: [
      { key: 'plate', label: 'Гос. номер', placeholder: 'А123БВ77' },
      { key: 'driver_name', label: 'Водитель', placeholder: 'Иванов И.И.' },
      { key: 'driver_phone', label: 'Телефон водителя', placeholder: '+7 (999) 000-00-00' },
      { key: 'carrier', label: 'Перевозчик', placeholder: 'ООО Транспорт' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'vessels', label: 'Суда', icon: 'Ship', primaryField: 'name',
    fields: [
      { key: 'name', label: 'Название', placeholder: 'MSC ANNA' },
      { key: 'flag', label: 'Флаг', placeholder: 'Panama' },
      { key: 'imo', label: 'IMO номер', placeholder: '1234567' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'wagons', label: 'Вагоны', icon: 'Train', primaryField: 'number',
    fields: [
      { key: 'number', label: 'Номер вагона', placeholder: '12345678' },
      { key: 'type', label: 'Тип', placeholder: 'Фитинговая платформа' },
      { key: 'owner', label: 'Владелец', placeholder: '' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'dgk', label: 'ДГК', icon: 'Zap', primaryField: 'number',
    fields: [
      { key: 'number', label: 'Номер ДГК', placeholder: 'DGK-001' },
      { key: 'owner', label: 'Владелец', placeholder: '' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'egk', label: 'ЭГК', icon: 'Zap', primaryField: 'number',
    fields: [
      { key: 'number', label: 'Номер ЭГК', placeholder: 'EGK-001' },
      { key: 'owner', label: 'Владелец', placeholder: '' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'ndgu', label: 'НДГУ', icon: 'Battery', primaryField: 'number',
    fields: [
      { key: 'number', label: 'Номер НДГУ', placeholder: 'NDGU-001' },
      { key: 'owner', label: 'Владелец', placeholder: '' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'stations', label: 'Станции', icon: 'MapPin', primaryField: 'name',
    fields: [
      { key: 'name', label: 'Название', placeholder: 'Москва-Товарная' },
      { key: 'code', label: 'Код ЕСР', placeholder: '060004' },
      { key: 'region', label: 'Регион', placeholder: 'Московская' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'terminals', label: 'Терминалы', icon: 'Warehouse', primaryField: 'name',
    fields: [
      { key: 'name', label: 'Название', placeholder: 'ПИК' },
      { key: 'city', label: 'Город', placeholder: 'Москва' },
      { key: 'address', label: 'Адрес', placeholder: 'ул. Примерная, 1' },
      { key: 'contact', label: 'Контакт', placeholder: '+7 (999) 000-00-00' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'cargo', label: 'Грузы', icon: 'Package', primaryField: 'name',
    fields: [
      { key: 'name', label: 'Название груза', placeholder: 'Мясо птицы' },
      { key: 'gng_code', label: 'Код ГНГ', placeholder: '0207' },
      { key: 'etsnv_code', label: 'Код ЕТСНВ', placeholder: '011' },
      { key: 'temp_mode', label: 'Температурный режим', placeholder: '-18' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
  {
    key: 'cities', label: 'Города', icon: 'MapPin', primaryField: 'name',
    fields: [
      { key: 'name', label: 'Название', placeholder: 'Москва' },
      { key: 'region', label: 'Регион', placeholder: 'Московская область' },
      { key: 'comment', label: 'Комментарий', placeholder: '' },
    ],
  },
];

// Примеры данных для каждого справочника
const SAMPLE_DATA: Record<DirKey, Record<string, string>[]> = {
  clients: [
    { name: 'ООО Ромашка', inn: '7701234567', contact_person: 'Иванов Иван', phone: '+7 (999) 111-22-33', email: 'info@romashka.ru', comment: '' },
    { name: 'ЗАО Север-Логист', inn: '7709876543', contact_person: 'Петрова Анна', phone: '+7 (495) 555-44-33', email: 'anna@sever.ru', comment: 'Постоянный клиент' },
  ],
  contractors: [
    { name: 'ООО ТрансГрупп', type: 'Перевозчик', inn: '7801234567', contact_person: 'Сидоров Петр', phone: '+7 (812) 444-55-66', email: 'info@transgroup.ru', comment: '' },
    { name: 'ИП Козлов', type: 'Экспедитор', inn: '781234567890', contact_person: 'Козлов М.А.', phone: '+7 (999) 777-88-99', email: '', comment: '' },
  ],
  containers: [
    { number: 'TCKU1234567', size: '40HC', owner: 'MSC', comment: '' },
    { number: 'MSCU9876543', size: '20', owner: 'CMA CGM', comment: '' },
    { number: 'HLXU3456789', size: '45', owner: 'Hapag-Lloyd', comment: 'Рефрижератор' },
  ],
  vehicles: [
    { plate: 'А123БВ77', driver_name: 'Иванов И.И.', driver_phone: '+7 (999) 111-22-33', carrier: 'ООО ТрансГрупп', comment: '' },
    { plate: 'К456МН178', driver_name: 'Петров П.П.', driver_phone: '+7 (812) 444-55-66', carrier: 'ИП Козлов', comment: '' },
  ],
  vessels: [
    { name: 'MSC ANNA', flag: 'Panama', imo: '9234567', comment: '' },
    { name: 'EVER GIVEN', flag: 'Panama', imo: '9811000', comment: '' },
  ],
  wagons: [
    { number: '12345678', type: 'Фитинговая платформа', owner: 'РЖД', comment: '' },
    { number: '87654321', type: 'Фитинговая платформа', owner: 'ФГК', comment: '' },
  ],
  dgk: [
    { number: 'DGK-001', owner: 'ООО Рефконтейнер', comment: '' },
    { number: 'DGK-002', owner: 'ООО Рефконтейнер', comment: '' },
  ],
  egk: [
    { number: 'EGK-001', owner: 'ООО ЭлектроСнаб', comment: '' },
    { number: 'EGK-002', owner: 'ООО ЭлектроСнаб', comment: '' },
  ],
  ndgu: [
    { number: 'NDGU-001', owner: 'ООО Рефсервис', comment: '' },
    { number: 'NDGU-002', owner: 'ООО Рефсервис', comment: '' },
  ],
  stations: [
    { name: 'Москва-Товарная', code: '060004', region: 'Московская', comment: '' },
    { name: 'Санкт-Петербург-Товарный', code: '030002', region: 'Ленинградская', comment: '' },
    { name: 'Новосибирск-Главный', code: '852000', region: 'Новосибирская', comment: '' },
  ],
  terminals: [
    { name: 'ПИК', city: 'Москва', address: 'г. Москва, ул. Складская, 1', contact: '+7 (495) 000-11-22', comment: '' },
    { name: 'КТК', city: 'Санкт-Петербург', address: 'г. СПб, пр. Портовый, 5', contact: '+7 (812) 333-44-55', comment: '' },
  ],
  cargo: [
    { name: 'Мясо птицы', gng_code: '0207', etsnv_code: '011', temp_mode: '-18', comment: '' },
    { name: 'Рыба мороженая', gng_code: '0303', etsnv_code: '012', temp_mode: '-18', comment: '' },
    { name: 'Овощи свежие', gng_code: '0702', etsnv_code: '051', temp_mode: '+4', comment: '' },
  ],
  cities: [
    { name: 'Москва', region: 'Московская область', comment: '' },
    { name: 'Санкт-Петербург', region: 'Ленинградская область', comment: '' },
    { name: 'Новосибирск', region: 'Новосибирская область', comment: '' },
  ],
};

function emptyForm(cfg: DirConfig): Row {
  return Object.fromEntries(cfg.fields.map(f => [f.key, '']));
}

function downloadSample(cfg: DirConfig) {
  const headers = cfg.fields.map(f => f.key);
  const samples = SAMPLE_DATA[cfg.key] || [];
  const wsData = [headers, ...samples.map(row => headers.map(h => row[h] || ''))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ширина столбцов
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, cfg.label);
  XLSX.writeFile(wb, `Пример_${cfg.label}.xlsx`);
}

// Компонент фильтра по столбцу
function ColFilterInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Icon name="Search" size={11} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-5 pr-1 py-0.5 text-xs border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <Icon name="X" size={10} />
        </button>
      )}
    </div>
  );
}

function DirectoryTable({ cfg }: { cfg: DirConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [importModal, setImportModal] = useState(false);
  const [form, setForm] = useState<Row>({});
  const [editId, setEditId] = useState('');
  const [importing, setImporting] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dbApi.get(cfg.key);
      setRows(res[cfg.key] || []);
    } finally {
      setLoading(false);
    }
  }, [cfg.key]);

  useEffect(() => { load(); }, [load]);

  // Сброс фильтров при смене справочника
  useEffect(() => { setColFilters({}); setSearch(''); }, [cfg.key]);

  const filtered = rows.filter(r => {
    // Глобальный поиск
    if (search && !cfg.fields.some(f => (r[f.key] || '').toLowerCase().includes(search.toLowerCase()))) return false;
    // Фильтры по столбцам
    for (const [key, val] of Object.entries(colFilters)) {
      if (val && !(r[key] || '').toLowerCase().includes(val.toLowerCase())) return false;
    }
    return true;
  });

  const openAdd = () => { setForm(emptyForm(cfg)); setModal('add'); };
  const openEdit = (row: Row) => { setForm({ ...row }); setEditId(row.id); setModal('edit'); };

  const handleSave = async () => {
    if (!form[cfg.primaryField]?.trim()) return;
    if (modal === 'add') {
      await dbApi.create(cfg.key, form);
      toast.success('Запись добавлена');
    } else {
      await dbApi.update(cfg.key, editId, form);
      toast.success('Запись обновлена');
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    await dbApi.delete(cfg.key, id);
    toast.success('Запись удалена');
    load();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const res = await dbApi.importExcel(cfg.key, b64);
      toast.success(`Импортировано: ${res.inserted} записей${res.skipped ? `, пропущено: ${res.skipped}` : ''}`);
      setImportModal(false);
      load();
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Ошибка импорта');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const hasColFilters = Object.values(colFilters).some(v => v);
  const visibleFields = cfg.fields.slice(0, 4);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="pl-8 h-8 text-sm" />
        </div>
        {hasColFilters && (
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setColFilters({})}>
            <Icon name="FilterX" size={13} className="mr-1" /> Сбросить фильтры
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => setImportModal(true)}>
          <Icon name="Upload" size={13} className="mr-1" /> Импорт Excel
        </Button>
        <Button size="sm" className="h-8 shrink-0" onClick={openAdd}>
          <Icon name="Plus" size={14} className="mr-1" /> Добавить
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Показано: {filtered.length} из {rows.length}
      </div>

      {/* Таблица */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
                {visibleFields.map(f => (
                  <th key={f.key} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                    <div className="space-y-1">
                      <span>{f.label}</span>
                      <ColFilterInput
                        value={colFilters[f.key] || ''}
                        onChange={v => setColFilters(p => ({ ...p, [f.key]: v }))}
                        placeholder={`Фильтр...`}
                      />
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={visibleFields.length + 2} className="text-center py-8 text-muted-foreground text-sm">Загрузка...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={visibleFields.length + 2} className="text-center py-10 text-muted-foreground">
                    <Icon name="Inbox" size={24} className="mx-auto mb-1 opacity-30" />
                    <p className="text-xs">Нет записей</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.map((row, idx) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                  {visibleFields.map((f, fi) => (
                    <td key={f.key} className="px-3 py-2 text-sm">
                      {fi === 0
                        ? <span className="font-medium text-foreground">{row[f.key]}</span>
                        : <span className="text-muted-foreground">{row[f.key]}</span>
                      }
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(row)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Icon name="Pencil" size={13} />
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка добавления/редактирования */}
      <Dialog open={modal !== null} onOpenChange={v => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === 'add' ? `Добавить: ${cfg.label}` : `Редактировать: ${cfg.label}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {cfg.fields.map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  value={form[f.key] || ''}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder || ''}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>Отмена</Button>
            <Button size="sm" onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка импорта Excel */}
      <Dialog open={importModal} onOpenChange={v => { if (!importing) setImportModal(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="FileSpreadsheet" size={18} className="text-green-600" />
              Импорт из Excel — {cfg.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Загрузите файл Excel (.xlsx). Первая строка — заголовки столбцов на английском (как в примере).
            </p>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Ожидаемые столбцы:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {cfg.fields.map(f => (
                  <span key={f.key} className="px-2 py-0.5 bg-background border border-border rounded text-xs font-mono text-muted-foreground">
                    {f.key}
                  </span>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => downloadSample(cfg)}
            >
              <Icon name="Download" size={14} className="mr-2 text-green-600" />
              Скачать пример файла (.xlsx)
            </Button>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                id="excel-import"
              />
              <label htmlFor="excel-import" className="cursor-pointer">
                <Icon name="Upload" size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {importing ? 'Загрузка...' : 'Нажмите для выбора файла'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Поддерживается .xlsx</p>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setImportModal(false)} disabled={importing}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Database() {
  const [active, setActive] = useState<DirKey>('clients');
  const activeCfg = DIRS.find(d => d.key === active)!;

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Левое меню справочников */}
      <div className="w-44 shrink-0 bg-card rounded-xl border border-border overflow-hidden self-start">
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Справочники</p>
        </div>
        <nav className="p-1.5 space-y-0.5">
          {DIRS.map(d => (
            <button
              key={d.key}
              onClick={() => setActive(d.key)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors',
                active === d.key
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground hover:bg-accent'
              )}
            >
              <Icon name={d.icon as Parameters<typeof Icon>[0]['name']} size={14} className="shrink-0" />
              <span className="truncate">{d.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Основная область */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <Icon name={activeCfg.icon as Parameters<typeof Icon>[0]['name']} size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">{activeCfg.label}</h2>
        </div>
        <DirectoryTable key={active} cfg={activeCfg} />
      </div>
    </div>
  );
}
