import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { authApi } from '@/lib/api';
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

const ROLE_SHORT: Record<string, string> = {
  logist: 'Логист',
  manager: 'Менеджер',
  director: 'Директор',
  admin: 'Администратор',
};

interface OnlineUser {
  id: string;
  name: string;
  role: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0] ?? '?';
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function TopBar() {
  const { section, sidebarOpen, setSidebarOpen, currentUser } = useAppStore();
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchOnline = () => {
      authApi.getOnlineUsers().then(res => setOnline(res.online || [])).catch(() => null);
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 30_000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const MAX_VISIBLE = 4;
  const visibleUsers = online.slice(0, MAX_VISIBLE);
  const hiddenCount = Math.max(0, online.length - MAX_VISIBLE);

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

      {currentUser && online.length > 0 && (
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setPopoverOpen(v => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">{online.length} онлайн</span>
            </div>
            <div className="flex -space-x-1.5">
              {visibleUsers.map(u => (
                <div
                  key={u.id}
                  title={u.name}
                  className={`w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white ${avatarColor(u.id)}`}
                >
                  {getInitials(u.name)}
                </div>
              ))}
              {hiddenCount > 0 && (
                <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                  +{hiddenCount}
                </div>
              )}
            </div>
          </button>

          {popoverOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 py-2 animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground px-3 pb-1.5 border-b border-border mb-1">
                Сейчас в системе
              </p>
              {online.map(u => (
                <div key={u.id} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor(u.id)}`}>
                    {getInitials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ROLE_SHORT[u.role] ?? u.role}</p>
                  </div>
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentUser && (
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(currentUser.id || '0')}`}>
            {getInitials(currentUser.name)}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
        </div>
      )}
    </header>
  );
}
