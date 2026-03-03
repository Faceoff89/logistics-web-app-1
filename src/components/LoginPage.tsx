import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { TelegramLoginButton } from '@/components/extensions/telegram-bot/TelegramLoginButton';

const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';

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
          <div className="mb-4">
            <img src="https://cdn.poehali.dev/projects/0aa0d198-0feb-42ce-b7f1-ebc1890de260/bucket/fc4da3cf-da71-492b-acb1-5cd2a3aa0462.svg" alt="Логотип" className="h-16 mx-auto" />
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
                placeholder="email@polar-star.ru"
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

          {TELEGRAM_BOT_USERNAME && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">или</span></div>
              </div>
              <div className="mt-4">
                <TelegramLoginButton
                  onClick={() => window.open(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=web_auth`, '_blank')}
                  className="w-full"
                />
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}