import type { ReactNode } from 'react';
import { t } from '../i18n';

/** Gazete sayfası çerçevesi: manşet başlığı + tarih satırı + içerik */
export function NewspaperShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const today = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

  return (
    <div className={`mx-auto px-4 py-6 ${wide ? 'max-w-6xl' : 'max-w-4xl'}`}>
      <header className="text-center mb-6">
        <div className="flex items-center justify-between text-[11px] font-score uppercase tracking-widest text-ink-soft border-b border-ink/40 pb-1">
          <span>{t('app.edition')}</span>
          <span>{today}</span>
          <span>Sayı No. 6</span>
        </div>
        <h1 className="masthead-title text-4xl sm:text-5xl mt-3 mb-2">{t('app.title')}</h1>
        <div className="rule-double py-1 text-xs font-score uppercase tracking-[0.3em] text-ink-soft">
          {t('app.tagline')}
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-10 pt-2 border-t border-ink/30 text-center text-[10px] font-score uppercase tracking-widest text-ink-faint">
        6Pas Neşriyat A.Ş. — Bütün hakları mahfuzdur
      </footer>
    </div>
  );
}

/** Bölüm başlığı: gazete ara manşeti */
export function SectionHeadline({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="text-center mb-5">
      <h2 className="headline text-2xl sm:text-3xl">{children}</h2>
      {sub && <p className="text-sm text-ink-soft italic mt-1">{sub}</p>}
      <div className="w-24 mx-auto mt-2 border-b-2 border-ink" />
    </div>
  );
}
