import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useGameStore } from '../store/useGameStore';

export function MatchResultScreen() {
  const {
    session,
    finalScore,
    penaltyScore,
    playerWon,
    playerDraw,
    rewards,
    manOfTheMatch,
    criticalMoment,
    afterResult,
    startNewTeamFlow,
    run,
  } = useGameStore();
  if (!session || !finalScore) return null;

  const headline = playerWon ? t('result.winHeadline') : playerDraw ? t('result.drawHeadline') : t('result.lossHeadline');

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <h2 className={`font-headline font-black text-5xl sm:text-6xl uppercase ${playerWon ? 'text-grass-deep' : playerDraw ? 'text-ink' : 'text-vermil'}`}>
          {headline}
        </h2>
        <div className="rule-double mt-3 py-2">
          <span className="font-headline font-bold text-lg">{session.home.info.teamName}</span>
          <span className="scoreboard-digit text-2xl mx-2">{finalScore[0]}</span>
          <span className="font-score text-ink-soft">—</span>
          <span className="scoreboard-digit text-2xl mx-2">{finalScore[1]}</span>
          <span className="font-headline font-bold text-lg">{session.away.info.teamName}</span>
          {penaltyScore && (
            <div className="text-sm font-score uppercase tracking-widest text-ink-soft mt-1.5">
              {t('result.penalties')}: {penaltyScore[0]} - {penaltyScore[1]}
            </div>
          )}
        </div>
      </div>

      {rewards && rewards.total > 0 && (
        <div className="news-card p-4 mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="tag-label">{t('result.pointsEarned')}</span>
            <span className="scoreboard-digit text-2xl">+{rewards.total}</span>
          </div>
          <ul className="text-sm space-y-0.5">
            {rewards.breakdown.map((b) => (
              <li key={b.reason} className="flex justify-between">
                <span>· {b.reason}</span>
                <span className="font-score font-bold">+{b.points}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs font-score uppercase tracking-widest text-ink-soft mt-2">
            {t('common.streak')}: {rewards.newStreak}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {manOfTheMatch && (
          <div className="news-card p-4">
            <div className="tag-label mb-1">{t('result.manOfTheMatch')}</div>
            <p className="font-headline font-bold text-lg">{manOfTheMatch}</p>
          </div>
        )}
        {criticalMoment && (
          <div className="news-card p-4">
            <div className="tag-label mb-1">{t('result.criticalMoment')}</div>
            <p className="text-sm italic leading-snug">“{criticalMoment}”</p>
          </div>
        )}
      </div>

      {playerDraw && <p className="text-sm italic text-ink-soft text-center mb-4">{t('result.drawNote')}</p>}
      {!playerWon && !playerDraw && (
        <p className="text-sm italic text-vermil text-center mb-4">{t('result.runOver')}</p>
      )}

      {playerWon || playerDraw ? (
        <button className="btn-press w-full text-lg" onClick={afterResult}>
          {t('result.playAgain')}
        </button>
      ) : (
        <button className="btn-press w-full text-lg" onClick={startNewTeamFlow}>
          {t('result.newRun')}
        </button>
      )}
      {run == null && !playerWon && !playerDraw && (
        <button className="btn-outline w-full mt-3" onClick={afterResult}>
          {t('common.back')}
        </button>
      )}
    </div>
  );
}
