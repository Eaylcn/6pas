import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useGameStore } from '../store/useGameStore';

export function ModeSelectScreen() {
  const goto = useGameStore((s) => s.goto);

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeadline>{t('mode.headline')}</SectionHeadline>
      <div className="space-y-3">
        <button className="news-card-clickable w-full p-5 text-left" onClick={() => goto('team-name')}>
          <div className="font-headline font-bold text-xl">{t('mode.classic')}</div>
          <p className="text-sm text-ink-soft mt-1">{t('mode.classicDesc')}</p>
        </button>
        <div className="news-card w-full p-5 text-left opacity-50">
          <div className="flex items-center justify-between">
            <div className="font-headline font-bold text-xl">{t('mode.ranked')}</div>
            <span className="tag-label">{t('common.comingSoon')}</span>
          </div>
        </div>
        <div className="news-card w-full p-5 text-left opacity-50">
          <div className="flex items-center justify-between">
            <div className="font-headline font-bold text-xl">{t('mode.tournament')}</div>
            <span className="tag-label">{t('common.comingSoon')}</span>
          </div>
        </div>
      </div>
      <button className="btn-outline w-full mt-5" onClick={() => goto('home')}>
        {t('common.back')}
      </button>
    </div>
  );
}
