import type { TeamMatchInfo } from '../types';
import { createRng, randomSeed } from '../utils/random';
import { findMatchForRun } from '../game/matchmakingEngine';

/**
 * MVP matchmaking: 1-3 sn bekletir, güç bandına uygun ghost rakip döner.
 * İleride gerçek kuyruk servisi aynı imzayla buraya bağlanır.
 */
export async function findOpponent(
  playerPower: number,
  playerTeamName: string,
  forcedName?: string,
): Promise<TeamMatchInfo> {
  const delay = 1000 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));
  const rng = createRng(randomSeed());
  return findMatchForRun(rng, playerPower, playerTeamName, forcedName);
}
