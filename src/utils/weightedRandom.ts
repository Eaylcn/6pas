import type { Rng } from './random';

export interface Weighted<T> {
  value: T;
  weight: number;
}

export function weightedPick<T>(rng: Rng, entries: readonly Weighted<T>[]): T {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng.next() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e.value;
  }
  return entries[entries.length - 1].value;
}
