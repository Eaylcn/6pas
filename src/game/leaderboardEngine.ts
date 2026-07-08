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
    /** Turnuva tablosunda: ulaşılan tur (kazanılan tur sayısı) */
    stageReached?: number;
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
    bestStage: update.stageReached !== undefined ? Math.max(entry.bestStage ?? 0, update.stageReached) : entry.bestStage,
    totalWins: entry.totalWins + (update.won ? 1 : 0),
    totalLosses: entry.totalLosses + (update.lost ? 1 : 0),
    matchesPlayed: entry.matchesPlayed + 1,
    currentActiveRunId: update.activeRunId,
  };
  const rest = entries.filter((e) => e.userId !== update.userId);
  return sortLeaderboard([...rest, updated]);
}

/** MVP: tabloyu dolduran bot menajerler — oyuncunun sırası anlamlı hissettirsin */
/** Turnuva tablosu botları — bestStage: kazanılan tur sayısı (5 = şampiyon) */
export const seedTournamentBots: LeaderboardEntry[] = [
  { userId: 'tbot-1', username: 'Emre Yıldız', totalPoints: 1120, bestStreak: 5, bestStage: 5, totalWins: 9, totalLosses: 2, matchesPlayed: 11, currentActiveRunId: null, isBot: true },
  { userId: 'tbot-2', username: 'Kaan Demir', totalPoints: 815, bestStreak: 4, bestStage: 4, totalWins: 7, totalLosses: 3, matchesPlayed: 10, currentActiveRunId: null, isBot: true },
  { userId: 'tbot-3', username: 'Burak Şahin', totalPoints: 540, bestStreak: 3, bestStage: 3, totalWins: 5, totalLosses: 3, matchesPlayed: 8, currentActiveRunId: null, isBot: true },
  { userId: 'tbot-4', username: 'Onur Aksoy', totalPoints: 310, bestStreak: 2, bestStage: 2, totalWins: 3, totalLosses: 4, matchesPlayed: 7, currentActiveRunId: null, isBot: true },
  { userId: 'tbot-5', username: 'Deniz Arslan', totalPoints: 120, bestStreak: 1, bestStage: 1, totalWins: 1, totalLosses: 3, matchesPlayed: 4, currentActiveRunId: null, isBot: true },
];

export const seedBots: LeaderboardEntry[] = [
  { userId: 'bot-1', username: 'Mert Korkmaz', totalPoints: 1840, bestStreak: 7, totalWins: 15, totalLosses: 6, matchesPlayed: 21, currentActiveRunId: null, isBot: true },
  { userId: 'bot-2', username: 'Serkan Doğan', totalPoints: 1465, bestStreak: 5, totalWins: 12, totalLosses: 7, matchesPlayed: 19, currentActiveRunId: null, isBot: true },
  { userId: 'bot-3', username: 'Tolga Yılmaz', totalPoints: 1210, bestStreak: 4, totalWins: 10, totalLosses: 8, matchesPlayed: 18, currentActiveRunId: null, isBot: true },
  { userId: 'bot-4', username: 'Cem Öztürk', totalPoints: 980, bestStreak: 4, totalWins: 8, totalLosses: 5, matchesPlayed: 13, currentActiveRunId: null, isBot: true },
  { userId: 'bot-5', username: 'Uğur Çelik', totalPoints: 760, bestStreak: 3, totalWins: 7, totalLosses: 9, matchesPlayed: 16, currentActiveRunId: null, isBot: true },
  { userId: 'bot-6', username: 'Barış Kaya', totalPoints: 545, bestStreak: 2, totalWins: 5, totalLosses: 4, matchesPlayed: 9, currentActiveRunId: null, isBot: true },
  { userId: 'bot-7', username: 'Hakan Aydın', totalPoints: 420, bestStreak: 2, totalWins: 4, totalLosses: 6, matchesPlayed: 10, currentActiveRunId: null, isBot: true },
  { userId: 'bot-8', username: 'Volkan Er', totalPoints: 230, bestStreak: 1, totalWins: 2, totalLosses: 3, matchesPlayed: 5, currentActiveRunId: null, isBot: true },
];
