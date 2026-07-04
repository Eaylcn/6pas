import type { LeaderboardEntry } from '../types';
import { seedBots, sortLeaderboard, updateLeaderboardAfterMatch } from '../game/leaderboardEngine';
import { load, save } from './storage';

const LB_KEY = 'leaderboard:classic';

export async function getClassicLeaderboard(): Promise<LeaderboardEntry[]> {
  const stored = await load<LeaderboardEntry[]>(LB_KEY);
  if (stored && stored.length > 0) return sortLeaderboard(stored);
  const seeded = sortLeaderboard(seedBots);
  await save(LB_KEY, seeded);
  return seeded;
}

export async function recordMatchResult(update: {
  userId: string;
  username: string;
  pointsGained: number;
  won: boolean;
  lost: boolean;
  streak: number;
  activeRunId: string | null;
}): Promise<LeaderboardEntry[]> {
  const entries = await getClassicLeaderboard();
  const updated = updateLeaderboardAfterMatch(entries, update);
  await save(LB_KEY, updated);
  return updated;
}
