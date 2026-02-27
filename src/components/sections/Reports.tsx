import { useAppStore } from '@/store/appStore';
import { DIRECTIONS_LABEL, TERMINALS } from '@/data/mock';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function StatRow({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <div className="text-right">
        <span className={cn('text-sm font-semibold', color ?? 'text-foreground')}>{value}</span>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function Reports() {
  const { shipments, equipment, flights } = useAppStore();

  const exportShipments = () => {
    const headers = ['Заявка', 'Клиент', 'Контейнер', 'Груз', 'Вес', 'Терминал', 'Статус', 'Рейс'];
    const rows = shipments.map(s => {
      const f = flights.find(fl => fl.id === s.flightId);
      return [s.request, s.client, s.containerNumber, s.cargo, s.weight, s.terminal, s.status, f?.number ?? ''].join(';');
    });
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'отправки.csv'; a.click();
  };

  const exportEquipment = () => {
    const headers = ['Номер', 'Тип', 'Статус', 'Терминал', 'Последняя проверка', 'Комментарий'];
    const rows = equipment.map(e => [e.number, e.type, e.status, e.location, e.lastCheck, e.comment].join(';'));
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'оборудование.csv'; a.click();
  };

  const totalWeight = shipments.reduce((acc, s) => acc + (s.weight || 0), 0);
  const avgWeight = shipments.length ? Math.round(totalWeight / shipments.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="BarChart2" size={15} className="text-muted-foreground" /> Сводка по отправкам
          </h3>
          <StatRow label="Всего отправок" value={shipments.length} />
          <StatRow label="Готовы к отправке" value={shipments.filter(s => s.status === 'ready').length} color="text-emerald-600" />
          <StatRow label="Не готовы" value={shipments.filter(s => s.status === 'not_ready').length} color="text-amber-600" />
          <StatRow label="В пути" value={shipments.filter(s => s.status === 'in_transit').length} color="text-blue-600" />
          <StatRow label="Общий вес груза" value={`${(totalWeight / 1000).toFixed(1)} т`} />
          <StatRow label="Средний вес" value={`${(avgWeight / 1000).toFixed(1)} т`} />
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="Package" size={15} className="text-muted-foreground" /> Сводка по оборудованию
          </h3>
          <StatRow label="Всего единиц" value={equipment.length} />
          <StatRow label="Контейнеры" value={equipment.filter(e => e.type === 'container').length} />
          <StatRow label="ДГК" value={equipment.filter(e => e.type === 'dgk').length} />
          <StatRow label="ЭГК" value={equipment.filter(e => e.type === 'egk').length} />
          <StatRow label="НДГУ" value={equipment.filter(e => e.type === 'ndgu').length} />
          <StatRow label="Проверено" value={equipment.filter(e => e.status === 'checked').length} color="text-emerald-600" />
          <StatRow label="Неисправно" value={equipment.filter(e => e.status === 'broken').length} color="text-red-600" />
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="Navigation" size={15} className="text-muted-foreground" /> По направлениям
          </h3>
          {Object.entries(DIRECTIONS_LABEL).map(([key, label]) => {
            const dirFlights = flights.filter(f => f.direction === key);
            const cnt = shipments.filter(s => dirFlights.some(f => f.id === s.flightId)).length;
            return <StatRow key={key} label={label} value={`${cnt} отправок`} sub={`${dirFlights.length} рейсов`} />;
          })}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="MapPin" size={15} className="text-muted-foreground" /> По терминалам
          </h3>
          {TERMINALS.map(t => {
            const eq = equipment.filter(e => e.location === t).length;
            const sh = shipments.filter(s => s.terminal === t).length;
            if (!eq && !sh) return null;
            return <StatRow key={t} label={t} value={`${sh} отправок`} sub={`${eq} единиц оборудования`} />;
          })}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Download" size={15} className="text-muted-foreground" /> Экспорт данных
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportShipments} className="gap-2">
            <Icon name="FileSpreadsheet" size={15} /> Отправки (CSV)
          </Button>
          <Button variant="outline" onClick={exportEquipment} className="gap-2">
            <Icon name="FileSpreadsheet" size={15} /> Оборудование (CSV)
          </Button>
        </div>
      </div>
    </div>
  );
}