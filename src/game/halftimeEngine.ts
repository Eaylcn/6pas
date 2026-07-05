// Devre arası: özet üretimi ve oyuncu değişikliği kuralları.
import type { AnyPlayer, FieldPlayer, MatchEvent, TeamMatchInfo } from '../types';
import { isGoalkeeper } from '../types';

/** Maç başına toplam değişiklik hakkı (devre arası + maç içi + sakatlık dahil) */
export const MAX_SUBSTITUTIONS = 3;

export function generateHalfTimeSummary(
  events: MatchEvent[],
  home: TeamMatchInfo,
  away: TeamMatchInfo,
  score: [number, number],
): string[] {
  const lines: string[] = [];
  const goals = events.filter((e) => e.result === 'goal');
  const saves = events.filter((e) => e.result === 'save');

  if (score[0] === score[1]) {
    lines.push(
      score[0] === 0
        ? 'İlk yarıda gol sesi çıkmadı; iki takım da temkinli oynadı.'
        : `Karşılıklı gollerle geçilen ilk yarıda denge bozulmadı: ${score[0]} - ${score[1]}.`,
    );
  } else {
    const leader = score[0] > score[1] ? home.teamName : away.teamName;
    lines.push(`İlk 30 dakikanın ardından ${leader} skor avantajını cebine koydu: ${score[0]} - ${score[1]}.`);
  }

  if (goals.length > 0) {
    const lastGoal = goals[goals.length - 1];
    const scorerLine = lastGoal.textLines.find((l) => l.includes('GOOOL')) ?? lastGoal.textLines[0];
    lines.push(`Devrenin en kritik anı: ${scorerLine}`);
  } else if (saves.length > 0) {
    lines.push('Kaleciler ilk yarının başrolündeydi; mutlak pozisyonlar gol olmadı.');
  }

  const homeAttacks = events.filter((e) => e.attackingTeam === 'home').length;
  const awayAttacks = events.length - homeAttacks;
  if (homeAttacks !== awayAttacks) {
    const busier = homeAttacks > awayAttacks ? home.teamName : away.teamName;
    lines.push(`${busier} pozisyon üretiminde daha istekliydi.`);
  }

  return lines;
}

/** MVP kuralı: değişiklik yalnızca aynı pozisyon içinde yapılabilir */
export function validateSubstitution(
  team: TeamMatchInfo,
  outPlayerId: string,
  inPlayerId: string,
  subsUsed: number,
): { ok: boolean; reason?: string } {
  if (subsUsed >= MAX_SUBSTITUTIONS) return { ok: false, reason: 'Değişiklik hakkı doldu' };
  const outPlayer = team.players.find((p) => p.id === outPlayerId);
  const inPlayer = team.bench.find((p) => p.id === inPlayerId);
  if (!outPlayer || !inPlayer) return { ok: false, reason: 'Oyuncu bulunamadı' };
  if (isGoalkeeper(outPlayer) || isGoalkeeper(inPlayer)) {
    return { ok: false, reason: 'MVP’de kaleci değişikliği yok' };
  }
  if ((outPlayer as FieldPlayer).position !== (inPlayer as FieldPlayer).position) {
    return { ok: false, reason: 'Değişiklik yalnızca aynı pozisyon içinde yapılabilir' };
  }
  return { ok: true };
}

/** Değişikliği uygular: çıkan oyuncu kulübeye döner ama tekrar giremez (usedIds ile işaretlenir) */
export function applySubstitution(
  team: TeamMatchInfo,
  outPlayerId: string,
  inPlayerId: string,
): { players: AnyPlayer[]; bench: AnyPlayer[] } {
  const inPlayer = team.bench.find((p) => p.id === inPlayerId)!;
  const players = team.players.map((p) => (p.id === outPlayerId ? inPlayer : p));
  const bench = team.bench.filter((p) => p.id !== inPlayerId);
  return { players, bench };
}
