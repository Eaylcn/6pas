import type { FieldPlayer } from '../types';
import { generateFieldPlayers } from './generator';
import { iconFieldPlayers } from './icons';

// Sabit seed → her derlemede aynı havuz (deterministik)
const POOL_SEED = 61234;

export const usedPlayerNames = new Set<string>(
  [...iconFieldPlayers.map((p) => p.name)],
);

export const fieldPlayers: FieldPlayer[] = [
  ...iconFieldPlayers,
  ...generateFieldPlayers(POOL_SEED, usedPlayerNames),
];
