// Turnuva modu: Son 32'den finale uzanan eleme yolu.
// Kadro klasikteki gibi draft edilir; her tur tek maç, kaybeden elenir.
// 32 takımlık kura ağacı maç maç işlenir; tur atlayan takımlar güçlenir
// (gittikçe zorlaşır ama asla "kesin kayıp" bandına çıkmaz).
import type { BracketMatch, BracketTeam, TournamentBracket } from '../types';
import type { Rng } from '../utils/random';
import { teamNamePool } from '../data/teams';

/** Sıradaki turun adı (wins = şu ana dek kazanılan tur sayısı) */
const ROUND_NAMES = ['Son 32', 'Son 16', 'Çeyrek Final', 'Yarı Final', 'FİNAL'] as const;

export const TOURNAMENT_TOTAL_ROUNDS = ROUND_NAMES.length;

export function tournamentRoundLabel(wins: number): string {
  if (wins >= TOURNAMENT_TOTAL_ROUNDS) return 'ŞAMPİYON';
  return ROUND_NAMES[Math.max(0, wins)];
}

/** Elendiği/tamamladığı aşamanın kaydı için etiket */
export function tournamentStageResult(wins: number, champion: boolean): string {
  if (champion) return '🏆 ŞAMPİYON';
  return `${tournamentRoundLabel(wins)} turunda elendi`;
}

/**
 * Tur ilerledikçe rakip güç bandı artar (matchmaking hedefine eklenir).
 * Rampa bilinçli olarak tavanlı: final zorlu ama kazanılabilir kalır.
 */
const POWER_RAMP = [0, 2, 3.5, 5, 6.5];
export function tournamentPowerBoost(wins: number): number {
  return POWER_RAMP[Math.min(wins, POWER_RAMP.length - 1)];
}

/** Tur atlama puanı (kazanılan turun zorluk sırasına göre) */
export function tournamentRoundBonus(winsBefore: number): number {
  const bonuses = [40, 55, 70, 90, 120];
  return bonuses[Math.min(winsBefore, bonuses.length - 1)];
}

export const TOURNAMENT_CHAMPION_BONUS = 300;

// ---- 32 takımlık kura ağacı ----

/** Turnuva başında kura çekilir: oyuncu 0. indekste, 31 ghost rakip */
export function createTournamentBracket(rng: Rng, playerTeamName: string, playerPower: number): TournamentBracket {
  const names = rng.shuffle(teamNamePool.filter((n) => n !== playerTeamName)).slice(0, 31);
  let filler = 1;
  while (names.length < 31) names.push(`Davetli Karma ${filler++}`);

  const teams: BracketTeam[] = [
    { name: playerTeamName, power: round1(playerPower), isPlayer: true },
    ...names.map((name) => ({ name, power: round1(playerPower + rng.int(-3, 3)), isPlayer: false })),
  ];

  const firstRound: BracketMatch[] = [];
  for (let i = 0; i < 16; i++) firstRound.push({ a: i * 2, b: i * 2 + 1 });

  return { teams, rounds: [firstRound, [], [], [], []] };
}

/** Oyuncunun sıradaki rakibi (kura ağacından) — yoksa null */
export function nextTournamentOpponent(bracket: TournamentBracket, wins: number): BracketTeam | null {
  const round = bracket.rounds[wins];
  if (!round || round.length === 0) return null;
  const m = round.find((x) => x.a === 0 || x.b === 0);
  if (!m || m.winner !== undefined) return null;
  return bracket.teams[m.a === 0 ? m.b : m.a] ?? null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function ghostGoals(rng: Rng): number {
  const r = rng.int(1, 100);
  if (r <= 45) return 1;
  if (r <= 80) return 2;
  if (r <= 95) return 3;
  return 4;
}

/**
 * Oyuncunun turu bitince ağaç işlenir: oyuncu maçının skoru yazılır,
 * diğer maçlar güç farkına göre simüle edilir, tur atlayan ghost'lar
 * güçlenir (+2) ve bir sonraki turun eşleşmeleri kurulur.
 */
export function advanceTournamentBracket(
  bracket: TournamentBracket,
  roundIdx: number,
  playerScore: [number, number],
  playerWon: boolean,
  playerPens: boolean,
  rng: Rng,
): TournamentBracket {
  const b: TournamentBracket = JSON.parse(JSON.stringify(bracket));
  const round = b.rounds[roundIdx];
  if (!round || round.length === 0) return b;

  for (const m of round) {
    if (m.winner !== undefined) continue;
    const isPlayerMatch = m.a === 0 || m.b === 0;
    if (isPlayerMatch) {
      const playerIsA = m.a === 0;
      m.scoreA = playerIsA ? playerScore[0] : playerScore[1];
      m.scoreB = playerIsA ? playerScore[1] : playerScore[0];
      if (playerPens) m.penalties = true;
      m.winner = playerWon ? 0 : playerIsA ? m.b : m.a;
    } else {
      const ta = b.teams[m.a];
      const tb = b.teams[m.b];
      const edge = Math.max(-0.35, Math.min(0.35, (ta.power - tb.power) * 0.06));
      const aWins = rng.chance(0.5 + edge);
      const wg = ghostGoals(rng);
      const lg = rng.int(0, Math.min(wg, 2));
      if (lg === wg) {
        // Eşitlik: skor aynı yazılır, kazanan seri penaltılarla belirlenmiş sayılır
        m.penalties = true;
        m.scoreA = wg;
        m.scoreB = wg;
      } else {
        m.scoreA = aWins ? wg : lg;
        m.scoreB = aWins ? lg : wg;
      }
      m.winner = aWins ? m.a : m.b;
    }
    // "Takımlar güçlenecek": tur atlayan ghost bir sonraki tura daha güçlü çıkar
    if (m.winner !== undefined && m.winner !== 0) {
      b.teams[m.winner].power = round1(b.teams[m.winner].power + 2);
    }
  }

  // Sonraki turun eşleşmeleri (oyuncu elendiyse de kurulur; ağaç okunur kalır)
  if (roundIdx < TOURNAMENT_TOTAL_ROUNDS - 1 && round.every((m) => m.winner !== undefined)) {
    const next: BracketMatch[] = [];
    for (let i = 0; i < round.length; i += 2) {
      next.push({ a: round[i].winner!, b: round[i + 1].winner! });
    }
    b.rounds[roundIdx + 1] = next;
  }

  return b;
}
