import { useState } from 'react';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';

export function LoginScreen() {
  const [name, setName] = useState('');
  const login = useUserStore((s) => s.login);
  const goto = useGameStore((s) => s.goto);

  const submit = async () => {
    if (name.trim().length < 2) return;
    await login(name);
    goto('home');
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
      <p className="text-center text-[11px] font-score uppercase tracking-widest text-ink-faint mt-4">
        ⭐ 2025-26 gerçek kadrolarıyla oynanır
      </p>
    </div>
  );
}
