// Turnuva modu: Son 32'den finale uzanan eleme yolu.
// Kadro klasikteki gibi draft edilir; her tur tek maç, kaybeden elenir.
// Tur ilerledikçe rakip güç bandı yükselir.

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

/** Tur ilerledikçe rakip güç bandı artar (matchmaking hedefine eklenir) */
export function tournamentPowerBoost(wins: number): number {
  return Math.min(wins, TOURNAMENT_TOTAL_ROUNDS - 1) * 1.5;
}

/** Tur atlama puanı (kazanılan turun zorluk sırasına göre) */
export function tournamentRoundBonus(winsBefore: number): number {
  const bonuses = [40, 55, 70, 90, 120];
  return bonuses[Math.min(winsBefore, bonuses.length - 1)];
}

export const TOURNAMENT_CHAMPION_BONUS = 300;
