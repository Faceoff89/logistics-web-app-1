import { useAppStore, Section } from '@/store/appStore';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/icon';

interface NavItem {
  id: Section;
  label: string;
  icon: string;
  parent?: string;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'planning-rail', label: 'Планирование ЖД', icon: 'TableProperties', parent: 'Планирование' },
  { id: 'planning-auto', label: 'Планирование АВТО', icon: 'Truck', parent: 'Планирование' },
  { id: 'planning-arrival', label: 'Планирование ПРИБЫТИЕ', icon: 'TrainFront', parent: 'Планирование' },
  { id: 'flights-rail', label: 'Рейсы ЖД', icon: 'Train', parent: 'Рейсы' },
  { id: 'rail-approaches', label: 'Подходы ЖД', icon: 'TrainTrack', parent: 'Рейсы' },
  { id: 'monitoring', label: 'Мониторинг', icon: 'Thermometer' },
  { id: 'equipment', label: 'Оборудование', icon: 'Container' },
  { id: 'requests', label: 'Заявки', icon: 'ClipboardList' },
  { id: 'database', label: 'База данных', icon: 'Database' },
  { id: 'accounts', label: 'Учётные записи', icon: 'Users' },
  { id: 'reports', label: 'Отчёты', icon: 'BarChart2' },
];

const ROLE_LABELS: Record<string, string> = {
  logist: 'Логист',
  manager: 'Менеджер',
  director: 'Директор',
  mechanic: 'Механик',
};

export default function Sidebar() {
  const { section, setSection, currentUser, logout, sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode } = useAppStore();

  const groups: Record<string, NavItem[]> = {};
  const standalone: NavItem[] = [];
  for (const item of NAV) {
    if (item.parent) {
      if (!groups[item.parent]) groups[item.parent] = [];
      groups[item.parent].push(item);
    } else {
      standalone.push(item);
    }
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300',
        'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
        sidebarOpen ? 'w-60' : 'w-0 lg:w-16 overflow-hidden',
      )}>
        <div className="flex items-center justify-center px-2 h-14 border-b border-sidebar-border shrink-0">
          <img src="https://cdn.poehali.dev/projects/0aa0d198-0feb-42ce-b7f1-ebc1890de260/bucket/fc4da3cf-da71-492b-acb1-5cd2a3aa0462.svg" alt="Логотип" className="h-10 w-auto object-contain" />
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {standalone.map(item => (
            <NavBtn key={item.id} item={item} active={section === item.id} collapsed={!sidebarOpen} onClick={() => { setSection(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }} />
          ))}

          {Object.entries(groups).map(([groupLabel, items]) => (
            <div key={groupLabel} className="pt-3">
              {sidebarOpen && (
                <p className="px-3 text-[10px] uppercase tracking-widest text-sidebar-foreground opacity-40 mb-1">{groupLabel}</p>
              )}
              {items.map(item => (
                <NavBtn key={item.id} item={item} active={section === item.id} collapsed={!sidebarOpen} onClick={() => { setSection(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }} />
              ))}
            </div>
          ))}
        </nav>

        <div className="px-2 pb-3 border-t border-sidebar-border pt-3 space-y-1 shrink-0">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-sidebar-accent transition-colors"
          >
            <Icon name={darkMode ? 'Sun' : 'Moon'} size={16} />
            {sidebarOpen && <span className="whitespace-nowrap">{darkMode ? 'Светлая тема' : 'Тёмная тема'}</span>}
          </button>

          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground shrink-0">
                {currentUser.name[0]}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-sidebar-foreground opacity-60">{ROLE_LABELS[currentUser.role]}</p>
                </div>
              )}
              {sidebarOpen && (
                <button onClick={logout} className="text-sidebar-foreground opacity-50 hover:opacity-100 transition-opacity">
                  <Icon name="LogOut" size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function NavBtn({ item, active, collapsed, onClick }: { item: NavItem; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors outline-none focus:outline-none',
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon name={item.icon} size={16} className="shrink-0" />
      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
    </button>
  );
}