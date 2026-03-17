import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { User } from '@/data/mock';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  logist: 'Логист',
  manager: 'Менеджер',
  director: 'Директор',
  admin: 'Администратор',
  mechanic: 'Механик',
};

const ROLE_COLORS: Record<string, string> = {
  logist: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  manager: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  director: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  mechanic: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const ACTION_ICONS: Record<string, string> = {
  'Редактирование отправки': 'Edit3',
  'Редактирование оборудования': 'Wrench',
  'Рейс отправлен': 'Train',
  'Удаление': 'Trash2',
};

type EditModal = { user: User; mode: 'edit' } | { mode: 'create' };

export default function Accounts() {
  const { logs, currentUser, users, loadUsers, createUser, updateUser, deleteUser } = useAppStore();
  const [modal, setModal] = useState<EditModal | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'logist', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = currentUser?.role === 'director' || currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const canCreate = currentUser?.role === 'director' || currentUser?.role === 'admin';

  useEffect(() => {
    if (canManage) loadUsers();
  }, [canManage]);

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', role: 'logist', is_active: true });
    setError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (user: User) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role, is_active: (user as User & { is_active?: boolean }).is_active !== false });
    setError('');
    setModal({ mode: 'edit', user });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Заполните имя и email'); return; }
    if (modal?.mode === 'create' && !form.password.trim()) { setError('Укажите пароль'); return; }
    setSaving(true);
    setError('');
    try {
      if (modal?.mode === 'create') {
        await createUser({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
      } else if (modal?.mode === 'edit') {
        const upd: Parameters<typeof updateUser>[1] = { name: form.name.trim(), email: form.email.trim(), role: form.role, is_active: form.is_active };
        if (form.password.trim()) upd.password = form.password;
        await updateUser((modal as { mode: 'edit'; user: User }).user.id, upd);
      }
      setModal(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const displayUsers = users.length > 0 ? users : (currentUser ? [currentUser] : []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Учётные записи</h1>
          <p className="text-sm text-muted-foreground">Управление сотрудниками и журнал действий</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate} className="h-8">
            <Icon name="UserPlus" size={14} className="mr-1.5" /> Добавить сотрудника
          </Button>
        )}
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 border-b border-border">
        {(['users', 'logs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon name={tab === 'users' ? 'Users' : 'Activity'} size={15} />
            {tab === 'users' ? 'Сотрудники' : 'Журнал действий'}
            <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
              {tab === 'users' ? displayUsers.length : logs.length}
            </span>
          </button>
        ))}
      </div>

      {/* Сотрудники */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayUsers.map(user => {
            const isActive = (user as User & { is_active?: boolean }).is_active !== false;
            return (
              <div
                key={user.id}
                className={cn(
                  'bg-card rounded-xl border p-4 transition-all hover:shadow-sm animate-fade-in',
                  currentUser?.id === user.id ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                  !isActive && 'opacity-60',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0',
                    isActive ? 'bg-primary' : 'bg-muted-foreground',
                  )}>
                    {user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      {!isActive && <span className="text-xs text-muted-foreground">(неактивен)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[user.role])}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                      {currentUser?.id === user.id && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Вы
                        </span>
                      )}
                    </div>
                  </div>
                  {canCreate && currentUser?.id !== user.id && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Редактировать"
                      >
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Журнал */}
      {activeTab === 'logs' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Activity" size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Журнал пуст</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {logs.slice(0, 200).map(log => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name={ACTION_ICONS[log.action] ?? 'Activity'} size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{log.userName}</span>
                      <span className="text-sm text-muted-foreground">{log.action}</span>
                      <span className="text-xs text-muted-foreground">· {log.entity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модалка подтверждения удаления */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Trash2" size={18} className="text-destructive" />
              Удалить учётную запись
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Вы уверены, что хотите удалить <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
            Это действие необратимо — все сессии пользователя будут завершены.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка создания/редактирования */}
      <Dialog open={!!modal} onOpenChange={v => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal?.mode === 'create' ? 'Новый сотрудник' : 'Редактировать сотрудника'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Имя <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Иван Иванов" />
            </div>
            <div className="space-y-1">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ivan@polarstar.ru" />
            </div>
            <div className="space-y-1">
              <Label>{modal?.mode === 'create' ? 'Пароль *' : 'Новый пароль (оставьте пустым для сохранения)'}</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <Label>Роль</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {modal?.mode === 'edit' && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <Label htmlFor="is_active" className="cursor-pointer font-normal">Аккаунт активен</Label>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <Icon name="AlertCircle" size={14} /> {error}
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModal(null)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />}
              {modal?.mode === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}