import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { tournamentRoundLabel } from '../game/tournamentEngine';
import { isOnline } from '../services/supabaseClient';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';

type Tab = 'classic' | 'tournament';

export function LeaderboardScreen() {
  const { leaderboard, tournamentBoard, user, refreshLeaderboard } = useUserStore();
  const goto = useGameStore((s) => s.goto);
  const [tab, setTab] = useState<Tab>('classic');
  const entries = tab === 'classic' ? leaderboard : tournamentBoard;

  // Ekran açılınca tabloyu tazele — online modda diğer oyuncuların skorları düşer
  useEffect(() => {
    void refreshLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <SectionHeadline sub={isOnline ? '🌐 Canlı — tüm menajerler' : t('leaderboard.sub')}>
        {t('leaderboard.headline')}
      </SectionHeadline>

      {/* Sekmeler: klasik ve turnuva tabloları ayrıdır */}
      <div className="flex gap-2 mb-3">
        <button
          className={`btn-outline text-xs px-4 py-1.5 ${tab === 'classic' ? 'bg-ink text-paper' : ''}`}
          onClick={() => setTab('classic')}
        >
          📰 KLASİK MOD
        </button>
        <button
          className={`btn-outline text-xs px-4 py-1.5 ${tab === 'tournament' ? 'bg-ink text-paper' : ''}`}
          onClick={() => setTab('tournament')}
        >
          🏆 TURNUVA
        </button>
      </div>

      <div className="news-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px]">{t('leaderboard.rank')}</th>
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px]">{t('leaderboard.manager')}</th>
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">{t('leaderboard.points')}</th>
              {tab === 'classic' ? (
                <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">{t('leaderboard.bestStreak')}</th>
              ) : (
                <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">EN İYİ AŞAMA</th>
              )}
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">{t('leaderboard.wins')}</th>
              <th className="px-3 py-2 font-score uppercase tracking-widest text-[10px] text-right">{t('leaderboard.losses')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isMe = user?.id === entry.userId;
              return (
                <tr key={entry.userId} className={`border-b border-ink/15 ${isMe ? 'bg-paper font-bold' : ''}`}>
                  <td className="px-3 py-2 font-score font-bold">{i + 1}</td>
                  <td className="px-3 py-2">
                    {entry.username} {isMe && <span className="text-grass-deep text-xs">{t('leaderboard.you')}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-score font-bold">{entry.totalPoints}</td>
                  {tab === 'classic' ? (
                    <td className="px-3 py-2 text-right font-score">{entry.bestStreak}</td>
                  ) : (
                    <td className="px-3 py-2 text-right font-score whitespace-nowrap">
                      {(entry.bestStage ?? 0) >= 5 ? '🏆 ŞAMPİYON' : (entry.bestStage ?? 0) > 0 ? tournamentRoundLabel(entry.bestStage ?? 0) : '—'}
                    </td>
                  )}
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
