import type { Rarity } from '../types';
import type { Rng } from '../utils/random';
import { weightedPick } from '../utils/weightedRandom';

/** Draft rarity ağırlıkları (spesifikasyon) */
export const rarityWeights: Array<{ value: Rarity; weight: number }> = [
  { value: 'common', weight: 35 },
  { value: 'solid', weight: 25 },
  { value: 'pro', weight: 20 },
  { value: 'star', weight: 12 },
  { value: 'legend', weight: 6 },
  { value: 'icon', weight: 2 },
];

export function getWeightedRandomRarity(rng: Rng): Rarity {
  return weightedPick(rng, rarityWeights);
}

/** Havuz yetersizse bir alt (sonra bir üst) rarity'ye düşerek doldurma sırası */
export const rarityFallbackOrder: Rarity[] = ['common', 'solid', 'pro', 'star', 'legend', 'icon'];

export function nearbyRarities(rarity: Rarity): Rarity[] {
  const idx = rarityFallbackOrder.indexOf(rarity);
  const result: Rarity[] = [rarity];
  for (let d = 1; d < rarityFallbackOrder.length; d++) {
    if (idx - d >= 0) result.push(rarityFallbackOrder[idx - d]);
    if (idx + d < rarityFallbackOrder.length) result.push(rarityFallbackOrder[idx + d]);
  }
  return result;
}
