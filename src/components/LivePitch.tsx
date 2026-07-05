// Canlı saha: anlatımla senkron hareket eden top + iki takımın dizilişi.
// Ev sahibi soldan sağa hücum eder. Top, olayın evresine göre pozisyona süzülür.
import { useMemo } from 'react';
import type { MatchEventType, TeamMatchInfo } from '../types';
import { isGoalkeeper } from '../types';

export interface BallCue {
  side: 'home' | 'away' | null;
  eventType: MatchEventType | 'penalti-seri' | null;
  /** Olay içindeki satır sırası ve toplam satır (ilerleme için) */
  idx: number;
  count: number;
  isResult: boolean;
  isGoal: boolean;
  resultKind: string | null; // EventResult
  minute: number;
}

const WING_TYPES = new Set<string>(['dar-aci', 'korner', 'ters-top', 'calim', 'rabona']);

function ballPos(cue: BallCue | null): { x: number; y: number } {
  if (!cue || !cue.side) {
    if (cue?.eventType === 'penalti-seri') return { x: 84, y: 31 };
    return { x: 50, y: 31 }; // santra
  }
  const dir = cue.side === 'home' ? 1 : -1;
  let y = 31;
  if (WING_TYPES.has(cue.eventType ?? '')) y = cue.minute % 2 === 0 ? 12 : 50;
  else if (cue.eventType === 'kafa') y = 26;
  else if (cue.eventType === 'uzaktan-sut') y = 34;

  // Meta olaylar
  if (cue.eventType === 'sakatlik' || cue.eventType === 'degisiklik') return { x: 50, y: 58 };
  if (cue.eventType === 'faul') return { x: 50 + dir * 24, y };
  if (cue.eventType === 'penalti') return { x: 50 + dir * 40, y: 31 };
  if (cue.eventType === 'serbest-vurus') {
    return cue.isResult ? { x: 50 + dir * 47, y: 31 } : { x: 50 + dir * 30, y };
  }

  if (cue.isResult) {
    switch (cue.resultKind) {
      case 'goal':
        return { x: 50 + dir * 49, y: 31 };
      case 'save':
        return { x: 50 + dir * 46, y: 31 };
      case 'miss':
        return { x: 50 + dir * 50, y: 8 };
      case 'corner-won':
        return { x: 50 + dir * 47, y: y <= 31 ? 4 : 58 };
      case 'blocked':
      case 'defended':
        return { x: 50 + dir * 18, y };
      default:
        return { x: 50 + dir * 30, y };
    }
  }
  const progress = cue.count > 1 ? cue.idx / (cue.count - 1) : 1;
  return { x: 50 + dir * (10 + 34 * progress), y };
}

function formationDots(team: TeamMatchInfo, mirrored: boolean) {
  const rows: Record<'GK' | 'DEF' | 'MID' | 'ATK', number> = mirrored
    ? { GK: 93, DEF: 80, MID: 67, ATK: 55 }
    : { GK: 7, DEF: 20, MID: 33, ATK: 45 };
  const byRow: Record<string, number> = {};
  const grouped: Record<string, typeof team.players> = { GK: [], DEF: [], MID: [], ATK: [] };
  for (const p of team.players) grouped[p.position]?.push(p);
  const dots: Array<{ x: number; y: number; gk: boolean; id: string }> = [];
  (['GK', 'DEF', 'MID', 'ATK'] as const).forEach((row) => {
    const players = grouped[row];
    players.forEach((p, i) => {
      dots.push({
        x: rows[row],
        y: ((i + 1) * 62) / (players.length + 1),
        gk: isGoalkeeper(p),
        id: p.id,
      });
    });
  });
  void byRow;
  return dots;
}

export function LivePitch({ home, away, cue }: { home: TeamMatchInfo; away: TeamMatchInfo; cue: BallCue | null }) {
  const homeDots = useMemo(() => formationDots(home, false), [home, home.players.length]);
  const awayDots = useMemo(() => formationDots(away, true), [away, away.players.length]);
  const pos = ballPos(cue);

  return (
    <svg viewBox="0 0 100 62" className="w-full news-card" role="img" aria-label="Canlı saha">
      {/* zemin + çizgiler */}
      <rect x="0" y="0" width="100" height="62" className="fill-grass" opacity="0.1" />
      <g className="stroke-ink" strokeWidth="0.35" fill="none" opacity="0.5">
        <rect x="1.5" y="1.5" width="97" height="59" />
        <line x1="50" y1="1.5" x2="50" y2="60.5" />
        <circle cx="50" cy="31" r="7" />
        <rect x="1.5" y="18" width="10" height="26" />
        <rect x="88.5" y="18" width="10" height="26" />
        <line x1="1.5" y1="25" x2="1.5" y2="37" strokeWidth="1.4" />
        <line x1="98.5" y1="25" x2="98.5" y2="37" strokeWidth="1.4" />
      </g>

      {/* diziliş noktaları */}
      {homeDots.map((d) => (
        <circle key={d.id} cx={d.x} cy={d.y} r={d.gk ? 2 : 1.7} className="fill-grass" opacity="0.85" />
      ))}
      {awayDots.map((d) => (
        <circle key={d.id} cx={d.x} cy={d.y} r={d.gk ? 2 : 1.7} className="fill-vermil" opacity="0.8" />
      ))}

      {/* top */}
      <g className="live-ball" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
        <circle r="1.6" className={cue?.isGoal ? 'fill-vermil ball-goal' : 'fill-paper'} stroke="rgb(var(--ink))" strokeWidth="0.5" />
      </g>

      {/* takım adları */}
      <text x="3" y="59.2" fontSize="2.6" className="fill-grass-deep font-score" letterSpacing="0.2">
        {home.teamName.toLocaleUpperCase('tr-TR')}
      </text>
      <text x="97" y="4.6" fontSize="2.6" textAnchor="end" className="fill-vermil font-score" letterSpacing="0.2">
        {away.teamName.toLocaleUpperCase('tr-TR')}
      </text>
    </svg>
  );
}
