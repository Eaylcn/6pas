import { useState } from 'react';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';
import { isOnline } from '../services/supabaseClient';

export function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useUserStore((s) => s.login);
  const register = useUserStore((s) => s.register);
  const refreshLeaderboard = useUserStore((s) => s.refreshLeaderboard);
  const goto = useGameStore((s) => s.goto);

  const canSubmit = name.trim().length >= 2 && (!isOnline || password.length >= 6) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isOnline && mode === 'register') await register(name, password);
      else await login(name, isOnline ? password : undefined);
      void refreshLeaderboard();
      goto('home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti — tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <SectionHeadline sub={t('login.sub')}>{t('login.headline')}</SectionHeadline>

      {isOnline && (
        <div className="flex gap-2 mb-3">
          <button
            className={`btn-outline text-xs px-4 py-1.5 flex-1 ${mode === 'login' ? 'bg-ink text-paper' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            GİRİŞ YAP
          </button>
          <button
            className={`btn-outline text-xs px-4 py-1.5 flex-1 ${mode === 'register' ? 'bg-ink text-paper' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            KAYIT OL
          </button>
        </div>
      )}

      <div className="news-card p-5 space-y-4">
        <label className="block">
          <span className="tag-label mb-1.5 inline-block">{t('login.usernameLabel')}</span>
          <input
            className="field-input"
            placeholder={t('login.usernamePlaceholder')}
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </label>

        {isOnline && (
          <label className="block">
            <span className="tag-label mb-1.5 inline-block">ŞİFRE</span>
            <input
              className="field-input"
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              maxLength={64}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            {mode === 'register' && (
              <p className="text-[11px] text-ink-faint mt-1">
                E-posta istemiyoruz; şifreni unutma — bu sürümde kurtarma yok.
              </p>
            )}
          </label>
        )}

        {error && <p className="text-xs font-semibold text-vermil">{error}</p>}

        <button className="btn-press w-full" disabled={!canSubmit} onClick={submit}>
          {busy ? 'Bekle…' : isOnline && mode === 'register' ? 'Hesap Aç ve Sahaya Çık' : t('login.enter')}
        </button>
      </div>

      <p className="text-center text-[11px] font-score uppercase tracking-widest text-ink-faint mt-4">
        ⭐ 2025-26 gerçek kadrolarıyla oynanır
        {isOnline && <> · 🌐 Canlı puan tabloları açık</>}
      </p>
    </div>
  );
}
