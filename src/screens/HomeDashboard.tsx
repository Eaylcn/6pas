import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';
import { getClippings, getRunHistory, type MatchClipping, type RunRecord } from '../services/historyService';
import { tournamentRoundLabel } from '../game/tournamentEngine';
import { isOnline } from '../services/supabaseClient';

export function HomeDashboard() {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const leaderboard = useUserStore((s) => s.leaderboard);
  const tournamentBoard = useUserStore((s) => s.tournamentBoard);
  const refreshLeaderboard = useUserStore((s) => s.refreshLeaderboard);
  const run = useGameStore((s) => s.run);
  const goto = useGameStore((s) => s.goto);
  const startNewTeamFlow = useGameStore((s) => s.startNewTeamFlow);
  const [clippings, setClippings] = useState<MatchClipping[]>([]);
  const [runHistory, setRunHistory] = useState<RunRecord[]>([]);
  const [boardTab, setBoardTab] = useState<'classic' | 'tournament'>('classic');

  useEffect(() => {
    void getClippings().then(setClippings);
    void getRunHistory().then(setRunHistory);
    void refreshLeaderboard();
  }, [refreshLeaderboard]);

  if (!user) return null;

  const boardEntries = (boardTab === 'classic' ? leaderboard : tournamentBoard).slice(0, 6);
  const modeIcon = run?.mode === 'tournament' ? '🏆 ' : run?.mode === 'career' ? '💪 ' : '';

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
            <p className="font-headline font-bold text-xl mb-1">
              {modeIcon}
              {run.teamName}
            </p>
            <p className="text-sm text-ink-soft mb-4">
              {run.mode === 'tournament'
                ? `Kupa yolu — sıradaki tur: ${tournamentRoundLabel(run.wins)} · ${run.pointsEarned} ${t('common.points').toLowerCase()}`
                : run.mode === 'career'
                  ? `Kariyer · ${run.wins} ${t('common.win').toLowerCase()} / ${run.losses} ${t('common.loss').toLowerCase()} · ${run.pointsEarned} ${t('common.points').toLowerCase()}`
                  : `${run.wins} ${t('common.win').toLowerCase()} · ${t('common.streak')}: ${run.streak} · ${run.pointsEarned} ${t('common.points').toLowerCase()}`}
            </p>
            <button className="btn-press w-full" onClick={() => goto('squad-review')}>
              {t('home.continueRun')}
            </button>
            {run.mode === 'tournament' && run.bracket && (
              <button className="btn-outline w-full mt-2" onClick={() => goto('bracket')}>
                🏆 Turnuva Ağacı
              </button>
            )}
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

      {/* Canlı puan tablosu — dashboard'da doğrudan görünür */}
      <div className="news-card p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="tag-label">{isOnline ? '🌐 CANLI PUAN TABLOSU' : 'PUAN TABLOSU'}</span>
          <div className="flex gap-1">
            <button
              className={`text-[10px] font-score uppercase px-2 py-0.5 border border-ink/40 ${boardTab === 'classic' ? 'bg-ink text-paper' : ''}`}
              onClick={() => setBoardTab('classic')}
            >
              KLASİK
            </button>
            <button
              className={`text-[10px] font-score uppercase px-2 py-0.5 border border-ink/40 ${boardTab === 'tournament' ? 'bg-ink text-paper' : ''}`}
              onClick={() => setBoardTab('tournament')}
            >
              🏆 TURNUVA
            </button>
          </div>
        </div>
        {boardEntries.length > 0 ? (
          <div className="space-y-1">
            {boardEntries.map((e, i) => {
              const isMe = e.userId === user.id;
              return (
                <div
                  key={e.userId}
                  className={`flex items-center gap-2 text-sm border-b border-ink/10 pb-1 ${isMe ? 'font-bold text-grass-deep' : ''}`}
                >
                  <span className="font-score font-bold w-5 text-center">{i + 1}</span>
                  <span className="truncate flex-1">
                    {e.username} {isMe && <span className="text-[10px]">(sen)</span>}
                  </span>
                  {boardTab === 'tournament' && (e.bestStage ?? 0) > 0 && (
                    <span className="text-[9px] font-score uppercase text-ink-soft shrink-0">
                      {(e.bestStage ?? 0) >= 5 ? '🏆' : tournamentRoundLabel(e.bestStage ?? 0)}
                    </span>
                  )}
                  <span className="font-score font-bold shrink-0">{e.totalPoints}p</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs italic text-ink-faint">Tablo henüz boş — ilk maçı sen kazan, adını ilk sen yazdır.</p>
        )}
        <button className="btn-outline w-full mt-3 text-xs py-1.5" onClick={() => goto('leaderboard')}>
          Tüm Tabloyu Gör →
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] font-score uppercase tracking-wider text-ink-soft flex-wrap gap-2">
        <span className="flex items-center gap-3">
          ⭐ 2025-26 gerçek kadroları + efsane ikonlar
          {isOnline && <span className="text-grass-deep">🌐 Canlı tablo</span>}
        </span>
        {isOnline && (
          <button
            className="underline hover:text-vermil"
            onClick={() => {
              void logout().then(() => goto('login'));
            }}
          >
            Çıkış Yap
          </button>
        )}
      </div>

      {clippings.length > 0 && (
        <div className="mt-6">
          <div className="tag-label mb-2">ARŞİVDEN KUPÜRLER</div>
          <div className="grid sm:grid-cols-3 gap-2">
            {clippings.slice(0, 3).map((c, i) => (
              <div key={i} className="news-card p-3" style={{ transform: `rotate(${(i % 2 === 0 ? -0.6 : 0.8)}deg)` }}>
                <div className={`font-headline font-bold text-xs uppercase leading-tight mb-1 ${c.won ? 'text-grass-deep' : 'text-vermil'}`}>
                  {c.headline}
                </div>
                <div className="text-[11px] font-score text-ink-soft">
                  {c.teamName} <b>{c.score[0]}-{c.score[1]}</b>
                  {c.penaltyScore ? ` (p ${c.penaltyScore[0]}-${c.penaltyScore[1]})` : ''} {c.opponentName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geçmişim: hangi takımla nereye kadar gidildi */}
      {runHistory.length > 0 && (
        <div className="mt-6">
          <div className="tag-label mb-2">GEÇMİŞİM — TAKIM DEFTERİ</div>
          <div className="news-card divide-y divide-ink/15">
            {runHistory.slice(0, 8).map((r) => (
              <div key={r.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="text-lg leading-none">{r.champion ? '🏆' : r.mode === 'tournament' ? '🎫' : '📰'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-headline font-bold truncate">
                    {r.teamName}
                    {r.captainName && <span className="font-body font-normal text-ink-soft text-xs"> · Ⓒ {r.captainName}</span>}
                  </div>
                  <div className={`text-[11px] font-score uppercase tracking-wider ${r.champion ? 'text-gold font-bold' : 'text-ink-soft'}`}>
                    {r.mode === 'tournament' ? 'Turnuva' : 'Klasik'} — {r.resultLabel}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-score font-bold">{r.points}p</div>
                  <div className="text-[10px] font-score text-ink-faint">
                    {new Date(r.endedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
