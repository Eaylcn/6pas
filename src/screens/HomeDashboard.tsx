import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';

export function HomeDashboard() {
  const user = useUserStore((s) => s.user);
  const run = useGameStore((s) => s.run);
  const goto = useGameStore((s) => s.goto);
  const startNewTeamFlow = useGameStore((s) => s.startNewTeamFlow);
  if (!user) return null;

  return (
    <div>
      <SectionHeadline sub={`${t('home.welcome')} ${user.username}`}>MENAJER MASASI</SectionHeadline>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label={t('home.totalPoints')} value={user.totalPoints} />
        <Stat label={t('home.bestStreak')} value={user.bestStreak} />
        <Stat label={t('home.record')} value={`${user.classicWins} / ${user.classicLosses}`} />
      </div>

      <div className="news-card p-5 mb-4">
        <div className="tag-label mb-2">{t('home.activeRun')}</div>
        {run ? (
          <>
            <p className="font-headline font-bold text-xl mb-1">{run.teamName}</p>
            <p className="text-sm text-ink-soft mb-4">
              {run.wins} {t('common.win').toLowerCase()} · {t('common.streak')}: {run.streak} · {run.pointsEarned}{' '}
              {t('common.points').toLowerCase()}
            </p>
            <button className="btn-press w-full" onClick={() => goto('squad-review')}>
              {t('home.continueRun')}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-soft italic mb-4">{t('home.noRun')}</p>
            <button className="btn-press w-full" onClick={startNewTeamFlow}>
              {t('home.newTeam')}
            </button>
          </>
        )}
      </div>

      <button className="btn-outline w-full" onClick={() => goto('leaderboard')}>
        {t('home.leaderboard')}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="news-card p-3 text-center">
      <div className="scoreboard-digit text-2xl">{value}</div>
      <div className="text-[10px] font-score uppercase tracking-widest text-ink-soft mt-1">{label}</div>
    </div>
  );
}
