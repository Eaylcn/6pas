// Seed'lenebilir PRNG — tekrarlanabilir maçlar ve deterministik veri üretimi için

export interface Rng {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // her iki uç dahil
  d20(): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  chance(p: number): boolean;
}

export function createRng(seed: number): Rng {
  // mulberry32
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    d20: () => 1 + Math.floor(next() * 20),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    chance: (p) => next() < p,
  };
  return rng;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

let idCounter = 0;
export function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}
