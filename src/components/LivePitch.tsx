// Canlı saha: anlatımla eşzamanlı hareket eden top.
// Ev sahibi soldan sağa hücum eder. Top, GELMEKTE OLAN satırın pozisyonuna
// satır ekrana düşerken süzülür — metin ve top aynı anda "varır".
// Penaltılarda (maç içi + seri) saha yerine ÖNDEN KALE sahnesi açılır:
// eldivenler kurtarışta topun köşesine uçar, golde ters köşede kalır.
// Vuruş detayı (cue.pen) motor tarafından anlatımla AYNI kaynaktan üretilir.
import type { MatchEventType, PenaltyDetail, PenSide, TeamMatchInfo } from '../types';

export interface BallCue {
  side: 'home' | 'away' | null;
  eventType: MatchEventType | 'penalti-seri' | null;
  idx: number;
  count: number;
  isResult: boolean;
  isGoal: boolean;
  resultKind: string | null;
  minute: number;
  /** Satır sırası — penaltı köşe seçimini vuruştan vuruşa değiştirir */
  seq: number;
  /** Penaltı vuruş detayı: anlatım satırıyla birebir aynı köşe/hamle */
  pen?: PenaltyDetail | null;
}

const WING_TYPES = new Set<string>(['dar-aci', 'korner', 'ters-top', 'calim', 'rabona']);

function isPenScene(cue: BallCue | null): boolean {
  return cue?.eventType === 'penalti' || cue?.eventType === 'penalti-seri';
}

// ---- Önden kale sahnesi geometrisi (viewBox 100x62) ----
const GOAL_L = 24;
const GOAL_R = 76;
const BAR_Y = 13;
const GROUND_Y = 45;
const SPOT = { x: 50, y: 56 };
const GLOVES_HOME = { x: 50, y: 39.5 }; // kaleci çizgi ortasında bekler

/** Vuruş yönü → sahnedeki x koordinatı */
const PEN_X: Record<PenSide, number> = { L: 29, C: 50, R: 71 };

/** Detay yoksa (ör. seri sonu özet satırları) deterministik yedek köşe */
function fallbackPen(cue: BallCue): PenaltyDetail {
  const left = (cue.minute * 7 + cue.seq) % 2 === 0;
  const high = (cue.minute * 3 + cue.seq) % 3 !== 0;
  const shotX: PenSide = left ? 'L' : 'R';
  return { shotX, high, diveX: cue.resultKind === 'save' ? shotX : left ? 'R' : 'L' };
}

/** Topun hedef noktası: köşeler üst/alt, orta vuruşlar kaleci hizasında */
function penTargetPoint(pen: PenaltyDetail): { x: number; y: number } {
  const x = PEN_X[pen.shotX];
  if (pen.shotX === 'C') return { x, y: pen.high ? 24 : 35 };
  return { x, y: pen.high ? 19.5 : 38.5 };
}

interface PenPose {
  ball: { x: number; y: number };
  gloves: { x: number; y: number };
  dived: boolean;
}

/** Topun ve eldivenlerin sahnedeki yeri — sonuç satırında ikisi birlikte hareket eder */
function penPose(cue: BallCue): PenPose {
  if (!cue.isResult) {
    // yaklaşma / nokta: top beyaz noktada, eldivenler çizgide hazır
    return { ball: SPOT, gloves: GLOVES_HOME, dived: false };
  }
  const pen = cue.pen ?? fallbackPen(cue);
  const target = penTargetPoint(pen);

  if (cue.resultKind === 'save') {
    // eldivenler topun gittiği yere uzanır; orta vuruşta kaleci yerinde kalır
    if (pen.shotX === 'C') {
      return { ball: { x: 50, y: target.y + 2 }, gloves: { x: 50, y: target.y }, dived: false };
    }
    const toCenter = target.x < 50 ? 1 : -1;
    return { ball: { x: target.x + toCenter * 2.6, y: target.y + 2.2 }, gloves: target, dived: true };
  }
  if (cue.resultKind === 'goal') {
    // top hedef köşede/ortada ağlarda; eldivenler kalecinin gittiği yönde kalakalır
    const glovesY = pen.shotX === 'C' ? 28 : target.y;
    return { ball: target, gloves: { x: PEN_X[pen.diveX], y: glovesY }, dived: true };
  }
  // kaçan vuruş: üst direğin üstünden aut ya da direkten dönüş
  if (pen.out === 'post') {
    const postBall = { x: pen.shotX === 'L' ? 21.4 : 78.6, y: pen.high ? 22 : 34 };
    return { ball: postBall, gloves: { x: PEN_X[pen.diveX], y: 30 }, dived: true };
  }
  const barX = 50 + (PEN_X[pen.shotX] - 50) * 0.5;
  return { ball: { x: barX, y: 4.5 }, gloves: { x: PEN_X[pen.diveX], y: 28 }, dived: true };
}

/** Önden kale: direkler, ağ, penaltı noktası, top ve uçan eldivenler */
function PenaltyGoalScene({ home, away, cue }: { home: TeamMatchInfo; away: TeamMatchInfo; cue: BallCue }) {
  const pose = penPose(cue);
  const attacker = cue.side === 'home' ? home : cue.side === 'away' ? away : null;
  const netVerticals: number[] = [];
  for (let x = GOAL_L + 4; x < GOAL_R; x += 4) netVerticals.push(x);
  const netHorizontals: number[] = [];
  for (let y = BAR_Y + 4.5; y < GROUND_Y; y += 4.5) netHorizontals.push(y);

  return (
    <svg viewBox="0 0 100 62" className="w-full news-card" role="img" aria-label="Penaltı — kale önü">
      {/* tribün gölgesi + çim ön plan */}
      <rect x="0" y="0" width="100" height="62" className="fill-ink" opacity="0.05" />
      <rect x="0" y={GROUND_Y} width="100" height={62 - GROUND_Y} className="fill-grass" opacity="0.14" />
      <line x1="0" y1={GROUND_Y} x2="100" y2={GROUND_Y} className="stroke-ink" strokeWidth="0.35" opacity="0.5" />

      {/* ağ */}
      <g className="stroke-ink" strokeWidth="0.18" opacity="0.22" fill="none">
        {netVerticals.map((x) => (
          <line key={`v${x}`} x1={x} y1={BAR_Y + 0.6} x2={x} y2={GROUND_Y - 0.3} />
        ))}
        {netHorizontals.map((y) => (
          <line key={`h${y}`} x1={GOAL_L + 0.6} y1={y} x2={GOAL_R - 0.6} y2={y} />
        ))}
      </g>

      {/* kale iskeleti */}
      <g className="stroke-ink" strokeWidth="1.1" fill="none" opacity="0.9" strokeLinecap="round">
        <line x1={GOAL_L} y1={BAR_Y} x2={GOAL_L} y2={GROUND_Y} />
        <line x1={GOAL_R} y1={BAR_Y} x2={GOAL_R} y2={GROUND_Y} />
        <line x1={GOAL_L} y1={BAR_Y} x2={GOAL_R} y2={BAR_Y} />
      </g>

      {/* penaltı noktası */}
      <ellipse cx={SPOT.x} cy={SPOT.y + 1.6} rx="2.2" ry="0.6" className="fill-ink" opacity="0.25" />

      {/* GOL: ağın dalgalanması */}
      {cue.isGoal && cue.isResult && (
        <circle cx={pose.ball.x} cy={pose.ball.y} r="3" fill="none" className="stroke-vermil goal-ring" strokeWidth="1" />
      )}

      {/* kurtarış parıltısı: eldivenler topu bulduğunda */}
      {cue.isResult && cue.resultKind === 'save' && (
        <circle cx={pose.gloves.x} cy={pose.gloves.y} r="3" fill="none" className="stroke-gold goal-ring" strokeWidth="0.9" />
      )}

      {/* eldivenler — kalecinin hamlesi */}
      <g className="live-ball pen-gloves" style={{ transform: `translate(${pose.gloves.x}px, ${pose.gloves.y}px)` }}>
        <g transform={pose.dived ? 'rotate(-18)' : undefined}>
          <rect x="-3.4" y="-1.4" width="2.9" height="3.4" rx="1.2" className="fill-gold" stroke="rgb(var(--ink))" strokeWidth="0.35" />
          <rect x="0.5" y="-1.7" width="2.9" height="3.4" rx="1.2" className="fill-gold" stroke="rgb(var(--ink))" strokeWidth="0.35" />
          <line x1="-2" y1="2.2" x2="-2" y2="3" className="stroke-ink" strokeWidth="0.4" opacity="0.6" />
          <line x1="2" y1="1.9" x2="2" y2="2.7" className="stroke-ink" strokeWidth="0.4" opacity="0.6" />
        </g>
      </g>

      {/* top */}
      <g className="live-ball" style={{ transform: `translate(${pose.ball.x}px, ${pose.ball.y}px)` }}>
        <circle
          r="1.7"
          className={cue.isGoal && cue.isResult ? 'fill-vermil ball-goal' : 'fill-paper'}
          stroke="rgb(var(--ink))"
          strokeWidth="0.5"
        />
      </g>

      {/* başlık + vuruşu kullanan takım */}
      <text x="50" y="7" fontSize="3.4" textAnchor="middle" className="fill-vermil font-score" letterSpacing="0.35">
        {cue.eventType === 'penalti-seri' ? 'SERİ PENALTILAR' : 'PENALTI'}
      </text>
      {attacker && (
        <text x="3" y="60.4" fontSize="2.6" className="fill-ink-soft font-score" letterSpacing="0.2">
          TOPUN BAŞINDA: {attacker.teamName.toLocaleUpperCase('tr-TR')}
        </text>
      )}
    </svg>
  );
}

function ballPos(cue: BallCue | null): { x: number; y: number } {
  if (!cue || !cue.side) {
    return { x: 50, y: 31 }; // santra
  }
  const dir = cue.side === 'home' ? 1 : -1;
  let y = 31;
  if (WING_TYPES.has(cue.eventType ?? '')) y = cue.minute % 2 === 0 ? 12 : 50;
  else if (cue.eventType === 'kafa') y = 26;
  else if (cue.eventType === 'uzaktan-sut') y = 34;

  if (cue.eventType === 'taktik') return { x: 50, y: 31 }; // kenar notu — top santrada bekler
  if (cue.eventType === 'sakatlik' || cue.eventType === 'degisiklik') return { x: 50, y: 58 };
  if (cue.eventType === 'gerginlik') return { x: 50 + dir * 24, y }; // faul noktasında itişme
  if (cue.eventType === 'faul') return { x: 50 + dir * 24, y };
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

export function LivePitch({ home, away, cue }: { home: TeamMatchInfo; away: TeamMatchInfo; cue: BallCue | null }) {
  if (cue && isPenScene(cue)) {
    return <PenaltyGoalScene home={home} away={away} cue={cue} />;
  }

  const pos = ballPos(cue);
  const goalDir = cue?.side === 'home' ? 1 : -1;

  return (
    <svg viewBox="0 0 100 62" className="w-full news-card" role="img" aria-label="Canlı saha">
      {/* zemin + çizgiler */}
      <rect x="0" y="0" width="100" height="62" className="fill-grass" opacity="0.1" />
      <g className="stroke-ink" strokeWidth="0.35" fill="none" opacity="0.5">
        <rect x="1.5" y="1.5" width="97" height="59" />
        <line x1="50" y1="1.5" x2="50" y2="60.5" />
        <circle cx="50" cy="31" r="7" />
        <circle cx="50" cy="31" r="0.7" className="fill-ink" opacity="0.5" />
        <rect x="1.5" y="18" width="10" height="26" />
        <rect x="88.5" y="18" width="10" height="26" />
        <line x1="1.5" y1="25" x2="1.5" y2="37" strokeWidth="1.4" />
        <line x1="98.5" y1="25" x2="98.5" y2="37" strokeWidth="1.4" />
      </g>

      {/* GOL halkası: ağların önünde patlayan halka */}
      {cue?.isGoal && (
        <circle
          cx={50 + goalDir * 47}
          cy={31}
          r="3"
          fill="none"
          className="stroke-vermil goal-ring"
          strokeWidth="1"
        />
      )}

      {/* top */}
      <g className="live-ball" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
        <circle
          r="1.7"
          className={cue?.isGoal ? 'fill-vermil ball-goal' : 'fill-paper'}
          stroke="rgb(var(--ink))"
          strokeWidth="0.5"
        />
      </g>

      {/* takım adları — hücum yönleriyle */}
      <text x="3" y="59.2" fontSize="2.6" className="fill-grass-deep font-score" letterSpacing="0.2">
        {home.teamName.toLocaleUpperCase('tr-TR')} →
      </text>
      <text x="97" y="4.6" fontSize="2.6" textAnchor="end" className="fill-vermil font-score" letterSpacing="0.2">
        ← {away.teamName.toLocaleUpperCase('tr-TR')}
      </text>
    </svg>
  );
}
