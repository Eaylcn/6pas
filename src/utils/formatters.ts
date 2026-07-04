import type { Rarity } from '../types';

export function formatMinute(minute: number): string {
  return `${minute}'`;
}

export function formatScore(score: [number, number]): string {
  return `${score[0]} - ${score[1]}`;
}

export const rarityLabels: Record<Rarity, string> = {
  common: 'Sıradan',
  solid: 'Sağlam',
  pro: 'Profesyonel',
  star: 'Yıldız',
  legend: 'Efsane',
  icon: 'İkon',
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
