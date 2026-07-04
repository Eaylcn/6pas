import type { Goalkeeper } from '../types';
import { generateGoalkeepers } from './generator';
import { iconGoalkeepers } from './icons';
import { usedPlayerNames } from './players';

const GK_SEED = 98721;

export const goalkeepers: Goalkeeper[] = [
  ...iconGoalkeepers,
  ...generateGoalkeepers(GK_SEED, usedPlayerNames),
];
