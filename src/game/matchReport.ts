// Maç sonu "gazete ön sayfası" verisi: manşet üreteci + istatistik türetme.
// Motora dokunmaz; yalnızca event verisinden okur.
import type { MatchEvent, PenaltyShootoutResult, TeamMatchInfo } from '../types';
import { getPerk, getPlayer } from '../data';

export interface TeamMatchStats {
  chances: number;
  shots: number;
  onTarget: number;
  saves: number;
  corners: number;
  fouls: number;
  yellows: number;
  reds: number;
}

export interface GoalLine {
  minute: number;
  scorer: string;
  side: 'home' | 'away';
  setPiece?: 'pen' | 'fk';
}

export interface CardLine {
  minute: number;
  player: string;
  card: 'yellow' | 'red';
  side: 'home' | 'away'; // kartı gören taraf
}

export interface SignatureMove {
  perkName: string;
  owner: string;
  count: number;
}

export interface MatchReport {
  headline: string;
  subhead: string;
  halfScore: [number, number];
  goals: GoalLine[];
  cards: CardLine[];
  stats: { home: TeamMatchStats; away: TeamMatchStats };
  motm: { name: string; reason: string } | null;
  /** Maçta iz bırakan perk tetiklenmeleri (perk + sahibi + kaç kez) */
  signatures: SignatureMove[];
}

const SHOT_RESULTS = new Set(['goal', 'save', 'miss']);
const CHANCE_RESULTS = new Set(['goal', 'save', 'miss', 'blocked', 'corner-won', 'defended']);

function statsFor(events: MatchEvent[], side: 'home' | 'away'): TeamMatchStats {
  const other = side === 'home' ? 'away' : 'home';
  const attacking = events.filter((e) => e.attackingTeam === side);
  const s: TeamMatchStats = {
    chances: attacking.filter((e) => CHANCE_RESULTS.has(e.result)).length,
    shots: attacking.filter((e) => SHOT_RESULTS.has(e.result)).length,
    onTarget: attacking.filter((e) => e.result === 'goal' || e.result === 'save').length,
    saves: events.filter((e) => e.attackingTeam === other && e.result === 'save').length,
    corners: attacking.filter((e) => e.type === 'korner' || e.result === 'corner-won').length,
    fouls: events.filter((e) => e.type === 'faul' && e.defendingTeam === side).length,
    yellows: events.filter((e) => e.card === 'yellow' && e.defendingTeam === side).length,
    reds: events.filter((e) => e.card === 'red' && e.defendingTeam === side).length,
  };
  return s;
}

function playerNameOf(id: string): string {
  try {
    return getPlayer(id).name;
  } catch {
    return '';
  }
}

function surnameOf(id: string): string {
  const name = playerNameOf(id);
  return name.split(' ').slice(-1)[0] ?? name;
}

// ---- Manşet üreteci (öncelik sıralı kurallar) ----
function pickHeadline(input: {
  won: boolean;
  finalScore: [number, number];
  goals: GoalLine[];
  penalties: PenaltyShootoutResult | null;
  homeReds: number;
  awayReds: number;
  streak: number;
  wasBehind: boolean;
}): string {
  const { won, finalScore, goals, penalties, homeReds, awayReds, streak, wasBehind } = input;
  const myGoals = finalScore[0];
  const oppGoals = finalScore[1];
  const lastGoal = goals[goals.length - 1];
  const lastMinuteWinner =
    lastGoal && lastGoal.minute >= 56 && Math.abs(myGoals - oppGoals) === 1 && (lastGoal.side === 'home') === won;

  if (penalties) {
    return won ? 'PENALTILARDA DESTAN YAZDILAR' : 'PENALTILAR KALBİMİZİ KIRDI';
  }
  if (won && lastMinuteWinner) return 'SON NEFESTE!';
  if (!won && lastMinuteWinner) return 'SON DAKİKA HANÇERİ';
  if (won && wasBehind) return 'KÜLLERİNDEN DOĞDU';
  if (won && myGoals >= 3 && oppGoals === 0) return 'SAHADA FIRTINA ESTİ';
  if (won && awayReds > 0) return 'ON KİŞİYE ACIMADILAR';
  if (!won && homeReds > 0) return 'KIRMIZI KART GECEYİ KARARTTI';
  if (won && oppGoals === 0) return 'KAPILAR KİLİTLİ';
  if (won && streak >= 3) return 'SERİ DURDURULAMIYOR';
  if (won) return myGoals - oppGoals >= 2 ? 'RAHAT GECE, TATLI ZAFER' : 'ZAFER BİZİM';
  if (myGoals === 0) return 'SUSKUN HÜCUM, ACI SON';
  return 'RÜYA YARIM KALDI';
}

function buildSubhead(input: {
  won: boolean;
  goals: GoalLine[];
  penalties: PenaltyShootoutResult | null;
  stats: { home: TeamMatchStats; away: TeamMatchStats };
  home: TeamMatchInfo;
  away: TeamMatchInfo;
}): string {
  const { won, goals, penalties, stats, home, away } = input;
  const parts: string[] = [];
  const myGoals = goals.filter((g) => g.side === 'home');
  if (penalties) {
    parts.push(
      `Doksan dakika yetmedi; kader seri penaltılarda ${penalties.homeGoals}-${penalties.awayGoals} yazdı.`,
    );
  } else if (myGoals.length > 0) {
    const scorers = [...new Set(myGoals.map((g) => g.scorer))];
    parts.push(
      scorers.length === 1
        ? `${scorers[0]}, ${myGoals.map((g) => `${g.minute}'`).join(' ve ')} dakikalarında sahneye çıktı.`
        : `Goller ${scorers.join(', ')} imzası taşıdı.`,
    );
  }
  if (stats.home.saves >= 3) parts.push(`Kalede ${stats.home.saves} kritik kurtarış gecenin sigortasıydı.`);
  if (parts.length === 0) {
    parts.push(
      won
        ? `${home.teamName} istediğini aldı, ${away.teamName} eli boş döndü.`
        : `${away.teamName} akşamın hesabını sahada kapattı.`,
    );
  }
  return parts.join(' ');
}

export function buildMatchReport(input: {
  events: MatchEvent[];
  home: TeamMatchInfo;
  away: TeamMatchInfo;
  finalScore: [number, number];
  penalties: PenaltyShootoutResult | null;
  won: boolean;
  streak: number;
}): MatchReport {
  const { events, home, away, finalScore, penalties, won, streak } = input;

  const goals: GoalLine[] = events
    .filter((e) => e.result === 'goal')
    .map((e) => ({
      minute: e.minute,
      scorer: surnameOf(e.playersInvolved[0]),
      side: e.attackingTeam,
      setPiece: e.setPiece,
    }));

  const cards: CardLine[] = events
    .filter((e) => e.card && e.cardPlayerId)
    .map((e) => ({
      minute: e.minute,
      player: surnameOf(e.cardPlayerId!),
      card: e.card!,
      side: e.defendingTeam,
    }));

  const h1 = events.filter((e) => e.half === 1);
  const lastH1 = h1[h1.length - 1];
  const halfScore: [number, number] = lastH1 ? lastH1.scoreAfterEvent : [0, 0];

  const stats = { home: statsFor(events, 'home'), away: statsFor(events, 'away') };

  // Geriden gelme kontrolü: herhangi bir anda skor aleyhteyken kazanma
  let wasBehind = false;
  for (const e of events) {
    if (e.scoreAfterEvent[0] < e.scoreAfterEvent[1]) wasBehind = true;
  }

  // Maçın adamı + gerekçe
  const impact = new Map<string, { score: number; goals: number; saves: number; stops: number }>();
  const bump = (id: string, kind: 'goal' | 'assist' | 'save' | 'stop') => {
    const entry = impact.get(id) ?? { score: 0, goals: 0, saves: 0, stops: 0 };
    if (kind === 'goal') {
      entry.score += 5;
      entry.goals++;
    } else if (kind === 'assist') entry.score += 2;
    else if (kind === 'save') {
      entry.score += 3;
      entry.saves++;
    } else {
      entry.score += 2;
      entry.stops++;
    }
    impact.set(id, entry);
  };
  for (const e of events) {
    if (e.result === 'goal') {
      bump(e.playersInvolved[0], 'goal');
      if (e.playersInvolved[1]) bump(e.playersInvolved[1], 'assist');
    } else if (e.result === 'save') {
      const gkId = e.playersInvolved[e.playersInvolved.length - 1];
      if (gkId) bump(gkId, 'save');
    } else if (e.result === 'blocked' || e.result === 'defended') {
      if (e.playersInvolved[2]) bump(e.playersInvolved[2], 'stop');
    }
  }
  let motm: MatchReport['motm'] = null;
  let best = 0;
  for (const [id, entry] of impact) {
    if (entry.score > best) {
      best = entry.score;
      const reasons: string[] = [];
      if (entry.goals > 0) reasons.push(`${entry.goals} gol`);
      if (entry.saves > 0) reasons.push(`${entry.saves} kurtarış`);
      if (entry.stops > 0 && reasons.length === 0) reasons.push(`${entry.stops} kritik müdahale`);
      motm = { name: playerNameOf(id), reason: reasons.join(', ') || 'sahanın her yerindeydi' };
    }
  }

  // İmza hareketleri: sonuca dokunan perk tetiklenmeleri
  const sigMap = new Map<string, SignatureMove>();
  for (const e of events) {
    if (e.hiddenPerksTriggered.length === 0) continue;
    if (!['goal', 'save', 'blocked'].includes(e.result)) continue;
    for (const perkId of e.hiddenPerksTriggered) {
      const perk = getPerk(perkId);
      if (!perk) continue;
      const ownerId = e.playersInvolved.find((id) => {
        try {
          return getPlayer(id).perks.includes(perkId);
        } catch {
          return false;
        }
      });
      if (!ownerId) continue;
      const key = `${perkId}:${ownerId}`;
      const existing = sigMap.get(key);
      if (existing) existing.count++;
      else sigMap.set(key, { perkName: perk.name, owner: surnameOf(ownerId), count: 1 });
    }
  }
  const signatures = [...sigMap.values()].sort((a, b) => b.count - a.count).slice(0, 6);

  const headline = pickHeadline({
    won,
    finalScore,
    goals,
    penalties,
    homeReds: stats.home.reds,
    awayReds: stats.away.reds,
    streak,
    wasBehind,
  });
  const subhead = buildSubhead({ won, goals, penalties, stats, home, away });

  return { headline, subhead, halfScore, goals, cards, stats, motm, signatures };
}
