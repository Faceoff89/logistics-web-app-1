import { useAppStore } from '@/store/appStore';
import { DIRECTIONS_LABEL, TERMINALS } from '@/data/mock';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

function MetricCard({ title, value, sub, icon, color }: { title: string; value: string | number; sub?: string; icon: string; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-4 animate-fade-in hover:shadow-sm transition-shadow">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{title}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { shipments, equipment, flights } = useAppStore();

  const totalContainers = equipment.filter(e => e.type === 'container').length;
  const totalDgk = equipment.filter(e => e.type === 'dgk').length;
  const totalEgk = equipment.filter(e => e.type === 'egk').length;
  const totalNdgu = equipment.filter(e => e.type === 'ndgu').length;

  const checked = equipment.filter(e => e.status === 'checked').length;
  const unchecked = equipment.filter(e => e.status === 'unchecked').length;
  const broken = equipment.filter(e => e.status === 'broken').length;
  const total = equipment.length;

  const ready = shipments.filter(s => s.status === 'ready').length;
  const notReady = shipments.filter(s => s.status === 'not_ready').length;

  const terminalCounts = TERMINALS.map(t => ({
    name: t,
    containers: equipment.filter(e => e.location === t).length,
    shipments: shipments.filter(s => s.terminal === t).length,
  }));

  const directionCounts = Object.entries(DIRECTIONS_LABEL).map(([key, label]) => {
    const dirFlights = flights.filter(f => f.direction === key);
    const dirShipments = shipments.filter(s => dirFlights.some(f => f.id === s.flightId));
    return { key, label, flights: dirFlights.length, shipments: dirShipments.length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Парк оборудования</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard title="Контейнеры" value={totalContainers} sub="рефрижераторных" icon="Container" color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <MetricCard title="ДГК" value={totalDgk} sub="дизельные генераторы" icon="Zap" color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
          <MetricCard title="ЭГК" value={totalEgk} sub="электрогенераторы" icon="Zap" color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
          <MetricCard title="НДГУ" value={totalNdgu} sub="независимые устройства" icon="Battery" color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
          <MetricCard title="Всего единиц" value={total} sub="в парке" icon="Package" color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="PieChart" size={15} className="text-muted-foreground" /> Статусы оборудования
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Проверены', count: checked, color: 'bg-emerald-500', pct: Math.round(checked / total * 100) },
              { label: 'Не проверены', count: unchecked, color: 'bg-amber-500', pct: Math.round(unchecked / total * 100) },
              { label: 'Неисправны', count: broken, color: 'bg-red-500', pct: Math.round(broken / total * 100) },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{row.label}</span>
                  <span className="text-muted-foreground">{row.count} · {row.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', row.color)} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="MapPin" size={15} className="text-muted-foreground" /> Дислокация по терминалам
          </h3>
          <div className="space-y-2">
            {terminalCounts.filter(t => t.containers > 0 || t.shipments > 0).map(t => (
              <div key={t.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm font-medium text-foreground">{t.name}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="Container" size={11} />{t.containers}</span>
                  <span className="flex items-center gap-1"><Icon name="Truck" size={11} />{t.shipments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="Navigation" size={15} className="text-muted-foreground" /> Отправки по направлениям
          </h3>
          <div className="space-y-3">
            {directionCounts.map(d => (
              <div key={d.key} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.flights} рейс · {d.shipments} отправок</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">{d.shipments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="ClipboardCheck" size={15} className="text-muted-foreground" /> Готовность отправок
          </h3>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{ready}</p>
              <p className="text-xs text-muted-foreground mt-1">Готово</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{notReady}</p>
              <p className="text-xs text-muted-foreground mt-1">Не готово</p>
            </div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden ml-4">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.round(ready / (ready + notReady) * 100)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {Math.round(ready / (ready + notReady) * 100)}%
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon name="Train" size={15} className="text-muted-foreground" /> Ближайшие рейсы
          </h3>
          <div className="space-y-2">
            {flights.slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{f.number}</p>
                  <p className="text-xs text-muted-foreground">{DIRECTIONS_LABEL[f.direction]} · план {f.planDate}</p>
                </div>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  f.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                  f.status === 'departed' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                )}>
                  {f.status === 'planned' ? 'Запланирован' : f.status === 'ready' ? 'Готов' : 'Отправлен'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}