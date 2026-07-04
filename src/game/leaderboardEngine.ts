import type { LeaderboardEntry } from '../types';

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    return b.totalWins - a.totalWins;
  });
}

export function updateLeaderboardAfterMatch(
  entries: LeaderboardEntry[],
  update: {
    userId: string;
    username: string;
    pointsGained: number;
    won: boolean;
    lost: boolean;
    streak: number;
    activeRunId: string | null;
  },
): LeaderboardEntry[] {
  const existing = entries.find((e) => e.userId === update.userId);
  const entry: LeaderboardEntry = existing ?? {
    userId: update.userId,
    username: update.username,
    totalPoints: 0,
    bestStreak: 0,
    totalWins: 0,
    totalLosses: 0,
    matchesPlayed: 0,
    currentActiveRunId: null,
  };
  const updated: LeaderboardEntry = {
    ...entry,
    username: update.username,
    totalPoints: entry.totalPoints + update.pointsGained,
    bestStreak: Math.max(entry.bestStreak, update.streak),
    totalWins: entry.totalWins + (update.won ? 1 : 0),
    totalLosses: entry.totalLosses + (update.lost ? 1 : 0),
    matchesPlayed: entry.matchesPlayed + 1,
    currentActiveRunId: update.activeRunId,
  };
  const rest = entries.filter((e) => e.userId !== update.userId);
  return sortLeaderboard([...rest, updated]);
}

/** MVP: tabloyu dolduran bot menajerler — oyuncunun sırası anlamlı hissettirsin */
export const seedBots: LeaderboardEntry[] = [
  { userId: 'bot-1', username: 'Rakipsiz Rıza', totalPoints: 1840, bestStreak: 7, totalWins: 15, totalLosses: 6, matchesPlayed: 21, currentActiveRunId: null, isBot: true },
  { userId: 'bot-2', username: 'Volebey', totalPoints: 1465, bestStreak: 5, totalWins: 12, totalLosses: 7, matchesPlayed: 19, currentActiveRunId: null, isBot: true },
  { userId: 'bot-3', username: 'Halısaha Aslanı', totalPoints: 1210, bestStreak: 4, totalWins: 10, totalLosses: 8, matchesPlayed: 18, currentActiveRunId: null, isBot: true },
  { userId: 'bot-4', username: 'TaçlıAdam', totalPoints: 980, bestStreak: 4, totalWins: 8, totalLosses: 5, matchesPlayed: 13, currentActiveRunId: null, isBot: true },
  { userId: 'bot-5', username: 'Ofsayttayım Hocam', totalPoints: 760, bestStreak: 3, totalWins: 7, totalLosses: 9, matchesPlayed: 16, currentActiveRunId: null, isBot: true },
  { userId: 'bot-6', username: 'Plase Prensi', totalPoints: 545, bestStreak: 2, totalWins: 5, totalLosses: 4, matchesPlayed: 9, currentActiveRunId: null, isBot: true },
  { userId: 'bot-7', username: 'Kaleci Dede', totalPoints: 420, bestStreak: 2, totalWins: 4, totalLosses: 6, matchesPlayed: 10, currentActiveRunId: null, isBot: true },
  { userId: 'bot-8', username: 'Çim Adam', totalPoints: 230, bestStreak: 1, totalWins: 2, totalLosses: 3, matchesPlayed: 5, currentActiveRunId: null, isBot: true },
];
