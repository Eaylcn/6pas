import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';
import { getClippings, getRunHistory, type MatchClipping, type RunRecord } from '../services/historyService';
import { tournamentRoundLabel } from '../game/tournamentEngine';
import { resetAllData } from '../services/storage';

export function HomeDashboard() {
  const user = useUserStore((s) => s.user);
  const run = useGameStore((s) => s.run);
  const goto = useGameStore((s) => s.goto);
  const startNewTeamFlow = useGameStore((s) => s.startNewTeamFlow);
  const [clippings, setClippings] = useState<MatchClipping[]>([]);
  const [runHistory, setRunHistory] = useState<RunRecord[]>([]);
  const [resetArmed, setResetArmed] = useState(false);

  useEffect(() => {
    void getClippings().then(setClippings);
    void getRunHistory().then(setRunHistory);
  }, []);

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
            <p className="font-headline font-bold text-xl mb-1">
              {run.mode === 'tournament' ? '🏆 ' : ''}
              {run.teamName}
            </p>
            <p className="text-sm text-ink-soft mb-4">
              {run.mode === 'tournament'
                ? `Kupa yolu — sıradaki tur: ${tournamentRoundLabel(run.wins)} · ${run.pointsEarned} ${t('common.points').toLowerCase()}`
                : `${run.wins} ${t('common.win').toLowerCase()} · ${t('common.streak')}: ${run.streak} · ${run.pointsEarned} ${t('common.points').toLowerCase()}`}
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

      <div className="flex items-center justify-between mt-3 text-[11px] font-score uppercase tracking-wider text-ink-soft">
        <span>⭐ 2025-26 gerçek kadroları</span>
        {/* window.confirm iframe'de engellenebildiği için iki aşamalı inline onay */}
        {resetArmed ? (
          <span className="flex items-center gap-2">
            <span className="text-vermil font-bold">Tüm veri silinsin mi?</span>
            <button
              className="underline text-vermil font-bold"
              onClick={() => {
                resetAllData();
                window.location.reload();
              }}
            >
              EVET, SIFIRLA
            </button>
            <button className="underline" onClick={() => setResetArmed(false)}>
              Vazgeç
            </button>
          </span>
        ) : (
          <button className="underline text-ink-faint hover:text-vermil" onClick={() => setResetArmed(true)}>
            🗑 Sıfırla (debug)
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
