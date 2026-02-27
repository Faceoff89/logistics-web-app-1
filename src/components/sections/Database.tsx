import { useState, useEffect, useCallback } from 'react';
import { dbApi, DirKey } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

function emptyForm(cfg: DirConfig): Row {
  return Object.fromEntries(cfg.fields.map(f => [f.key, '']));
}

function DirectoryTable({ cfg }: { cfg: DirConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<Row>({});
  const [editId, setEditId] = useState('');

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

  const filtered = rows.filter(r =>
    cfg.fields.some(f => (r[f.key] || '').toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(emptyForm(cfg)); setModal('add'); };
  const openEdit = (row: Row) => { setForm({ ...row }); setEditId(row.id); setModal('edit'); };

  const handleSave = async () => {
    if (!form[cfg.primaryField]?.trim()) return;
    if (modal === 'add') {
      await dbApi.create(cfg.key, form);
    } else {
      await dbApi.update(cfg.key, editId, form);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    await dbApi.delete(cfg.key, id);
    load();
  };

  const primaryField = cfg.fields[0];
  const visibleFields = cfg.fields.slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Поиск...`} className="pl-8 h-8 text-sm" />
        </div>
        <Button size="sm" className="h-8 shrink-0" onClick={openAdd}>
          <Icon name="Plus" size={14} className="mr-1" /> Добавить
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
                {visibleFields.map(f => (
                  <th key={f.key} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{f.label}</th>
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
                    <p className="text-xs">Пусто</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.map((row, idx) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                  {visibleFields.map(f => (
                    <td key={f.key} className="px-3 py-2 text-sm">
                      {f.key === primaryField.key
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
