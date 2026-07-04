import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { TeamPanel } from '../components/TeamPanel';
import { useGameStore } from '../store/useGameStore';

export function MatchmakingScreen() {
  const { run, opponent, opponentFound, startMatch } = useGameStore();
  if (!run) return null;

  if (!opponentFound || !opponent) {
    return (
      <div className="max-w-md mx-auto text-center">
        <SectionHeadline sub={t('matchmaking.sub')}>{t('matchmaking.headline')}</SectionHeadline>
        <div className="news-card p-10">
          <div className="font-headline text-5xl animate-pulse">⚽</div>
          <p className="mt-4 text-sm font-score uppercase tracking-widest text-ink-soft animate-pulse">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SectionHeadline sub={t('matchmaking.vs')}>{t('matchmaking.found')}</SectionHeadline>
      <div className="news-card p-4 mb-4 text-center">
        <span className="font-headline font-bold text-xl">{run.teamName}</span>
        <span className="font-score text-ink-soft mx-3 text-lg">—</span>
        <span className="font-headline font-bold text-xl">{opponent.teamName}</span>
        <div className="text-[11px] font-score uppercase tracking-widest text-ink-soft mt-1">
          {t('common.teamPower')}: {opponent.power}
        </div>
      </div>
      <div className="mb-5 max-h-[380px] overflow-y-auto news-card p-4">
        <TeamPanel team={opponent} compact />
      </div>
      <button className="btn-press w-full text-lg" onClick={startMatch}>
        {t('matchmaking.startMatch')}
      </button>
    </div>
  );
}
