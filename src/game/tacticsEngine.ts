import type { PlayStyle, TacticalPlan } from '../types';

export interface TacticModifiers {
  /** Pozisyon üretim çarpanı (event sahipliği ağırlığı) */
  tempo: number;
  attack: number;
  defense: number;
  goalkeeper: number;
  /** Rakip şut kalitesine uygulanan ceza */
  opponentShotPenalty: number;
  /** Kontra event üretme eğilimi */
  counterBias: number;
}

const baseModifiers: Record<PlayStyle, TacticModifiers> = {
  ofansif: { tempo: 1.25, attack: 2, defense: -2, goalkeeper: 0, opponentShotPenalty: 0, counterBias: 0 },
  dengeli: { tempo: 1, attack: 0, defense: 0, goalkeeper: 0, opponentShotPenalty: 0, counterBias: 0 },
  defansif: { tempo: 0.8, attack: -1, defense: 2, goalkeeper: 1, opponentShotPenalty: 1, counterBias: 0 },
  kontra: { tempo: 0.9, attack: 0, defense: 1, goalkeeper: 0, opponentShotPenalty: 0, counterBias: 0.35 },
};

/** Skor durumuna göre aktif taktiği döndürür */
export function getActiveTacticByScoreState(
  plan: TacticalPlan,
  myGoals: number,
  opponentGoals: number,
): PlayStyle {
  if (myGoals > opponentGoals) return plan.whenWinning;
  if (myGoals < opponentGoals) return plan.whenLosing;
  return plan.whenDrawing;
}

/**
 * Aktif taktiğin modifier'ları. Kontra, rakip ofansif oynuyorsa güçlenir;
 * diziliş uyumu (playStyleAffinity) küçük gizli bonus verir.
 */
export function applyTacticModifiers(
  style: PlayStyle,
  opponentStyle: PlayStyle,
  formationAffinity: PlayStyle,
): TacticModifiers {
  const mods = { ...baseModifiers[style] };
  if (style === 'kontra' && opponentStyle === 'ofansif') {
    mods.counterBias += 0.3;
    mods.attack += 2; // kontra ataklarında güç
  }
  if (formationAffinity === style) {
    mods.attack += 0.5;
    mods.defense += 0.5;
  }
  // Ofansif rakibe karşı savunmadaki açıklar: rakip kontra şansı yukarıda counterBias ile işlenir
  return mods;
}

export function updateTacticalPlanAtHalftime(plan: TacticalPlan, updates: Partial<TacticalPlan>): TacticalPlan {
  return { ...plan, ...updates };
}
