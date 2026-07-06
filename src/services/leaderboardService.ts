import type { LeaderboardEntry } from '../types';
import { seedBots, seedTournamentBots, sortLeaderboard, updateLeaderboardAfterMatch } from '../game/leaderboardEngine';
import { load, save } from './storage';

export type LeaderboardMode = 'classic' | 'tournament';

const KEYS: Record<LeaderboardMode, string> = {
  classic: 'leaderboard:classic',
  tournament: 'leaderboard:tournament',
};

export async function getLeaderboard(mode: LeaderboardMode): Promise<LeaderboardEntry[]> {
  const stored = await load<LeaderboardEntry[]>(KEYS[mode]);
  if (stored && stored.length > 0) return sortLeaderboard(stored);
  const seeded = sortLeaderboard(mode === 'classic' ? seedBots : seedTournamentBots);
  await save(KEYS[mode], seeded);
  return seeded;
}

/** Geriye dönük uyumluluk: klasik tablo */
export async function getClassicLeaderboard(): Promise<LeaderboardEntry[]> {
  return getLeaderboard('classic');
}

export async function recordMatchResult(
  mode: LeaderboardMode,
  update: {
    userId: string;
    username: string;
    pointsGained: number;
    won: boolean;
    lost: boolean;
    streak: number;
    activeRunId: string | null;
    /** Turnuvada ulaşılan tur (kazanılan tur sayısı) */
    stageReached?: number;
  },
): Promise<LeaderboardEntry[]> {
  const entries = await getLeaderboard(mode);
  const updated = updateLeaderboardAfterMatch(entries, update);
  await save(KEYS[mode], updated);
  return updated;
}
