import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

export default function LoginPage() {
  const login = useAppStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login(email, password);
    if (!ok) setError('Неверный email или пароль');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <Icon name="Star" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Полярная Звезда</h1>
          <p className="text-sm text-muted-foreground mt-1">Система управления логистикой</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="logist@polarstar.ru"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="h-10"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <Icon name="AlertCircle" size={14} /> {error}
              </p>
            )}
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
              Войти
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">Тестовые аккаунты:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {[
                { label: 'Логист', email: 'logist@polarstar.ru' },
                { label: 'Менеджер', email: 'manager@polarstar.ru' },
                { label: 'Директор', email: 'director@polarstar.ru' },
              ].map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={async () => {
                    setEmail(u.email); setPassword('123456'); setError('');
                    setLoading(true);
                    const ok = await login(u.email, '123456');
                    if (!ok) setError('Неверный email или пароль');
                    setLoading(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted transition-colors flex justify-between"
                >
                  <span className="font-medium text-foreground">{u.label}</span>
                  <span>{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}