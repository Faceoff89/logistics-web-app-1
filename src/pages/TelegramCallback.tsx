import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import Icon from '@/components/ui/icon';

const TELEGRAM_AUTH_URL = 'https://functions.poehali.dev/9eac6dd8-6c64-4b52-a917-02bbdf16c992';

export default function TelegramCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAppStore();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setErrorMsg('Токен не найден. Попробуйте войти снова.');
      setStatus('error');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${TELEGRAM_AUTH_URL}?action=callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Ошибка авторизации');
          setStatus('error');
          return;
        }
        localStorage.setItem('auth_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('telegram_auth_refresh_token', data.refresh_token);
        }
        await loginWithToken(data.access_token, data.user);
        navigate('/', { replace: true });
      } catch {
        setErrorMsg('Ошибка сети. Попробуйте снова.');
        setStatus('error');
      }
    })();
  }, [navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 max-w-sm w-full text-center space-y-4">
        {status === 'loading' ? (
          <>
            <div className="w-14 h-14 rounded-full bg-[#0088cc]/10 flex items-center justify-center mx-auto">
              <Icon name="Loader2" size={28} className="text-[#0088cc] animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Выполняется вход...</p>
              <p className="text-sm text-muted-foreground mt-1">Проверяем данные Telegram</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Icon name="AlertCircle" size={28} className="text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Ошибка входа</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-primary hover:underline"
            >
              Вернуться на главную
            </button>
          </>
        )}
      </div>
    </div>
  );
}
