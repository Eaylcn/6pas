import { useMemo } from 'react';
import { t } from '../i18n';
import { buildMatchReport } from '../game/matchReport';
import { computeMatchRatings, ratingTone, type PlayerRating } from '../game/ratingsEngine';
import { tournamentRoundLabel } from '../game/tournamentEngine';
import { useGameStore } from '../store/useGameStore';

export function MatchResultScreen() {
  const {
    session,
    finalScore,
    penaltyScore,
    playerWon,
    playerChampion,
    rewards,
    afterResult,
    startNewTeamFlow,
    run,
  } = useGameStore();

  const report = useMemo(() => {
    if (!session || !finalScore) return null;
    return buildMatchReport({
      events: session.events,
      home: session.sim.home.info,
      away: session.sim.away.info,
      finalScore,
      penalties: session.penalties,
      won: playerWon,
      streak: rewards?.newStreak ?? 0,
    });
  }, [session, finalScore, playerWon, rewards]);

  const ratings = useMemo(() => {
    if (!session) return null;
    return {
      home: computeMatchRatings(session.events, session.sim.home, 'home'),
      away: computeMatchRatings(session.events, session.sim.away, 'away'),
    };
  }, [session]);

  if (!session || !finalScore || !report) return null;
  const home = session.sim.home.info;
  const away = session.sim.away.info;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Şampiyonluk bandı */}
      {playerChampion && (
        <div className="border-4 border-double border-gold bg-gold/10 text-center py-4 px-3 mb-5">
          <div className="text-4xl mb-1">🏆</div>
          <div className="font-headline font-black text-2xl sm:text-3xl uppercase text-gold">KUPA {home.teamName.toLocaleUpperCase('tr-TR')}'İN!</div>
          <p className="text-sm italic text-ink-soft mt-1">
            Son 32'den başlayan yol finalde taçlandı. Bu kadro artık turnuva tablosunda ve takım defterinde.
          </p>
        </div>
      )}

      {/* Manşet */}
      <div className="text-center mb-5">
        <div className="text-[10px] font-score uppercase tracking-[0.35em] text-ink-soft mb-2">
          — MAÇ SONU ÖZEL BASKISI —
        </div>
        <h2
          className={`font-headline font-black text-4xl sm:text-6xl uppercase leading-tight ${
            playerWon ? 'text-grass-deep' : 'text-vermil'
          }`}
          style={{ textWrap: 'balance' as never }}
        >
          {report.headline}
        </h2>
        <p className="text-sm italic text-ink-soft mt-2 max-w-lg mx-auto">{report.subhead}</p>
      </div>

      {/* Skor kutusu */}
      <div className="rule-double py-3 text-center mb-5">
        <span className="font-headline font-bold text-lg">{home.teamName}</span>
        <span className="scoreboard-digit text-3xl mx-2">{finalScore[0]}</span>
        <span className="font-score text-ink-soft">—</span>
        <span className="scoreboard-digit text-3xl mx-2">{finalScore[1]}</span>
        <span className="font-headline font-bold text-lg">{away.teamName}</span>
        <div className="text-[11px] font-score uppercase tracking-widest text-ink-soft mt-1.5">
          İlk Yarı: {report.halfScore[0]} - {report.halfScore[1]}
          {penaltyScore && (
            <>
              {' · '}
              {t('result.penalties')}: {penaltyScore[0]} - {penaltyScore[1]}
            </>
          )}
        </div>
      </div>

      {/* Goller + kartlar */}
      {(report.goals.length > 0 || report.cards.length > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
          <div className="text-right space-y-0.5">
            {report.goals
              .filter((g) => g.side === 'home')
              .map((g, i) => (
                <div key={i}>
                  {g.scorer} {g.minute}' {g.setPiece === 'pen' ? '(P)' : g.setPiece === 'fk' ? '(SV)' : ''} ⚽
                </div>
              ))}
            {report.cards
              .filter((c) => c.side === 'home')
              .map((c, i) => (
                <div key={`c${i}`} className="text-ink-soft text-xs">
                  {c.player} {c.minute}' {c.card === 'red' ? '🟥' : '🟨'}
                </div>
              ))}
          </div>
          <div className="space-y-0.5">
            {report.goals
              .filter((g) => g.side === 'away')
              .map((g, i) => (
                <div key={i}>
                  ⚽ {g.minute}' {g.scorer} {g.setPiece === 'pen' ? '(P)' : g.setPiece === 'fk' ? '(SV)' : ''}
                </div>
              ))}
            {report.cards
              .filter((c) => c.side === 'away')
              .map((c, i) => (
                <div key={`c${i}`} className="text-ink-soft text-xs">
                  {c.card === 'red' ? '🟥' : '🟨'} {c.minute}' {c.player}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* İstatistik karşılaştırması */}
      <div className="news-card p-4 mb-4">
        <div className="tag-label mb-3">MAÇIN RÖNTGENİ</div>
        <StatRow label="Önemli An" a={report.stats.home.chances} b={report.stats.away.chances} />
        <StatRow label="Şut" a={report.stats.home.shots} b={report.stats.away.shots} />
        <StatRow label="İsabetli Şut" a={report.stats.home.onTarget} b={report.stats.away.onTarget} />
        <StatRow label="Kurtarış" a={report.stats.home.saves} b={report.stats.away.saves} />
        <StatRow label="Korner" a={report.stats.home.corners} b={report.stats.away.corners} />
        <StatRow label="Faul" a={report.stats.home.fouls} b={report.stats.away.fouls} />
        <StatRow label="Kimya" a={home.chemistry.score} b={away.chemistry.score} max={100} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {report.motm && (
          <div className="news-card p-4">
            <div className="tag-label mb-1">{t('result.manOfTheMatch')}</div>
            <p className="font-headline font-bold text-lg">{report.motm.name}</p>
            <p className="text-xs text-ink-soft italic">({report.motm.reason})</p>
          </div>
        )}
        {(report.cards.length > 0 || report.stats.home.fouls + report.stats.away.fouls > 0) && (
          <div className="news-card p-4">
            <div className="tag-label mb-1">HAKEM KARNESİ</div>
            <p className="text-sm">
              {report.stats.home.fouls + report.stats.away.fouls} faul ·{' '}
              {report.cards.filter((c) => c.card === 'yellow').length} sarı ·{' '}
              {report.cards.filter((c) => c.card === 'red').length} kırmızı
            </p>
            {session.penalties === null && report.goals.some((g) => g.setPiece === 'pen') && (
              <p className="text-xs text-ink-soft italic mt-1">Penaltı kararı maça damga vurdu.</p>
            )}
          </div>
        )}
      </div>

      {/* İmza hareketleri: perklerin maça etkisi */}
      {report.signatures.length > 0 && (
        <div className="news-card p-4 mb-4">
          <div className="tag-label mb-2">✍ İMZA HAREKETLERİ</div>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {report.signatures.map((s, i) => (
              <div key={i} className="flex items-baseline justify-between">
                <span>
                  <span className="font-headline font-bold">“{s.perkName}”</span>
                  <span className="text-ink-soft"> — {s.owner}</span>
                </span>
                {s.count > 1 && <span className="font-score font-bold text-gold">×{s.count}</span>}
              </div>
            ))}
          </div>
          <p className="text-[11px] italic text-ink-faint mt-2">
            Bu özellikler maçta pozisyonların sonucuna doğrudan dokundu.
          </p>
        </div>
      )}

      {/* Oyuncu karneleri (SofaScore tarzı) */}
      {ratings && (
        <div className="news-card p-4 mb-4">
          <div className="tag-label mb-3">OYUNCU KARNELERİ</div>
          <div className="grid grid-cols-2 gap-4">
            <RatingColumn title={home.teamName} list={ratings.home} />
            <RatingColumn title={away.teamName} list={ratings.away} />
          </div>
        </div>
      )}

      {/* Puan dökümü */}
      {rewards && rewards.total > 0 && (
        <div className="news-card p-4 mb-5">
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
            {t('common.streak')}: {rewards.newStreak} {rewards.newStreak >= 2 ? '🔥' : ''}
          </p>
        </div>
      )}

      {!playerWon && <p className="text-sm italic text-vermil text-center mb-4">{t('result.runOver')}</p>}

      {/* Turnuvada tur atlama notu */}
      {playerWon && !playerChampion && run?.mode === 'tournament' && (
        <p className="text-sm text-center font-semibold text-grass-deep mb-3">
          🏆 Tur atlandı! Sıradaki durak: {tournamentRoundLabel(run.wins)}
        </p>
      )}

      {playerWon && !playerChampion ? (
        <button className="btn-press w-full text-lg" onClick={afterResult}>
          {run?.mode === 'tournament' ? 'Sıradaki Tura Hazırlan' : t('result.playAgain')}
        </button>
      ) : (
        <>
          <button className="btn-press w-full text-lg" onClick={startNewTeamFlow}>
            {playerChampion ? 'Yeni Bir Maceraya Başla' : t('result.newRun')}
          </button>
          {run == null && (
            <button className="btn-outline w-full mt-3" onClick={afterResult}>
              {t('common.back')}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function RatingColumn({ title, list }: { title: string; list: PlayerRating[] }) {
  const toneClass = { great: 'bg-grass text-paper', good: 'bg-ink text-paper', poor: 'bg-vermil text-paper' };
  return (
    <div>
      <div className="font-headline font-bold text-sm mb-1.5 truncate">{title}</div>
      <div className="space-y-1">
        {list.map((r) => (
          <div key={r.player.id} className="flex items-center gap-1.5 text-xs">
            <span
              className={`font-score font-bold px-1 py-0.5 min-w-[30px] text-center ${toneClass[ratingTone(r.rating)]}`}
            >
              {r.rating.toFixed(1)}
            </span>
            <span className="truncate flex-1">{r.player.name}</span>
            <span className="text-ink-faint shrink-0">
              {'⚽'.repeat(r.goals)}
              {r.assists > 0 ? '🅰' : ''}
              {r.saves >= 2 ? '🧤' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, a, b, max }: { label: string; a: number; b: number; max?: number }) {
  const total = max ?? Math.max(1, a + b);
  const aPct = max ? (a / max) * 100 : (a / total) * 100;
  const bPct = max ? (b / max) * 100 : (b / total) * 100;
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <span className="font-score font-bold w-6 text-right">{a}</span>
      <div className="flex-1 flex gap-0.5 h-2">
        <div className="flex-1 bg-paper-deep border border-ink/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 bg-grass" style={{ width: `${aPct}%` }} />
        </div>
        <div className="flex-1 bg-paper-deep border border-ink/20 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 bg-vermil/70" style={{ width: `${bPct}%` }} />
        </div>
      </div>
      <span className="font-score font-bold w-6">{b}</span>
      <span className="text-[10px] font-score uppercase tracking-wider text-ink-faint w-20">{label}</span>
    </div>
  );
}
