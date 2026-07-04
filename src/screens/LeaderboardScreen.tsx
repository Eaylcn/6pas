import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';

export function LeaderboardScreen() {
  const { leaderboard, user } = useUserStore();
  const goto = useGameStore((s) => s.goto);

  return (
    <div className="max-w-2xl mx-auto">
      <SectionHeadline sub={t('leaderboard.sub')}>{t('leaderboard.headline')}</SectionHeadline>

      <div className="news-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px]">{t('leaderboard.rank')}</th>
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px]">{t('leaderboard.manager')}</th>
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">{t('leaderboard.points')}</th>
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">{t('leaderboard.bestStreak')}</th>
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">{t('leaderboard.wins')}</th>
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">{t('leaderboard.losses')}</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, i) => {
              const isMe = user?.id === entry.userId;
              return (
                <tr key={entry.userId} className={`border-b border-ink/15 ${isMe ? 'bg-paper font-bold' : ''}`}>
                  <td className="px-3 py-2 font-score font-bold">{i + 1}</td>
                  <td className="px-3 py-2">
                    {entry.username} {isMe && <span className="text-grass-deep text-xs">{t('leaderboard.you')}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-score font-bold">{entry.totalPoints}</td>
                  <td className="px-3 py-2 text-right font-score">{entry.bestStreak}</td>
                  <td className="px-3 py-2 text-right font-score">{entry.totalWins}</td>
                  <td className="px-3 py-2 text-right font-score">{entry.totalLosses}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button className="btn-outline w-full mt-5" onClick={() => goto('home')}>
        {t('common.back')}
      </button>
    </div>
  );
}
