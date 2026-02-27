import { useAppStore } from '@/store/appStore';
import Icon from '@/components/ui/icon';

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Дашборд',
  'planning-rail': 'Планирование ЖД',
  'flights-rail': 'Рейсы ЖД',
  equipment: 'Оборудование',
  requests: 'Заявки',
  accounts: 'Учётные записи',
  reports: 'Отчёты',
  database: 'База данных',
};

export default function TopBar() {
  const { section, sidebarOpen, setSidebarOpen, currentUser } = useAppStore();

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-10">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={18} />
      </button>

      <h1 className="text-sm font-semibold text-foreground">{SECTION_TITLES[section] ?? 'Полярная Звезда'}</h1>

      <div className="flex-1" />

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden sm:inline">В сети</span>
      </div>

      {currentUser && (
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            {currentUser.name[0]}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
        </div>
      )}
    </header>
  );
}