import { useState } from 'react';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';
import { isRealModeEnabled, setRealMode, REAL_MODE_PASSWORD } from '../data/realMode';

export function LoginScreen() {
  const [name, setName] = useState('');
  const [realMode, setRealModeState] = useState(() => isRealModeEnabled());
  const [askPassword, setAskPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);
  const login = useUserStore((s) => s.login);
  const goto = useGameStore((s) => s.goto);

  const submit = async () => {
    if (name.trim().length < 2) return;
    await login(name);
    goto('home');
  };

  const toggleRealMode = () => {
    setPwError(false);
    if (realMode) {
      // Kapatmak şifresiz — sayfa yenilenerek fake isimlere dönülür
      setRealMode(false);
      window.location.reload();
      return;
    }
    setAskPassword(true);
  };

  const confirmPassword = () => {
    if (password === REAL_MODE_PASSWORD) {
      setRealMode(true);
      window.location.reload();
    } else {
      setPwError(true);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <SectionHeadline sub={t('login.sub')}>{t('login.headline')}</SectionHeadline>
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
        <button className="btn-press w-full" disabled={name.trim().length < 2} onClick={submit}>
          {t('login.enter')}
        </button>
      </div>

      {/* Gerçek Yıldızlar Modu (test) */}
      <div className="news-card p-4 mt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-headline font-bold text-sm">⭐ Gerçek Yıldızlar Modu</div>
            <p className="text-xs text-ink-soft">
              {realMode
                ? 'Açık — gerçek yıldız ve kulüp isimleriyle oynuyorsun.'
                : 'Gerçek oyuncu ve takım isimleriyle oyna (şifre gerekli, test).'}
            </p>
          </div>
          <button className={`btn-outline text-xs px-3 py-1.5 shrink-0 ${realMode ? 'bg-ink text-paper' : ''}`} onClick={toggleRealMode}>
            {realMode ? 'Kapat' : 'Aç'}
          </button>
        </div>
        {askPassword && !realMode && (
          <div className="mt-3 flex gap-2">
            <input
              className="field-input !py-1.5 !text-sm"
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmPassword()}
            />
            <button className="btn-press text-xs px-3" onClick={confirmPassword}>
              Onayla
            </button>
          </div>
        )}
        {pwError && <p className="text-xs font-semibold text-vermil mt-1.5">Şifre yanlış.</p>}
      </div>
    </div>
  );
}
