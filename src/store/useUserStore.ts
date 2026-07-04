import { create } from 'zustand';
import type { LeaderboardEntry, User } from '../types';
import * as authService from '../services/authService';
import * as leaderboardService from '../services/leaderboardService';

interface UserState {
  user: User | null;
  leaderboard: LeaderboardEntry[];
  initialized: boolean;
  init: () => Promise<void>;
  login: (username: string) => Promise<User>;
  refreshLeaderboard: () => Promise<void>;
  applyMatchOutcome: (input: {
    pointsGained: number;
    won: boolean;
    lost: boolean;
    streak: number;
    activeRunId: string | null;
  }) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  leaderboard: [],
  initialized: false,

  init: async () => {
    const user = await authService.getCurrentUser();
    const leaderboard = await leaderboardService.getClassicLeaderboard();
    set({ user, leaderboard, initialized: true });
  },

  login: async (username: string) => {
    const user = await authService.login(username.trim());
    set({ user });
    return user;
  },

  refreshLeaderboard: async () => {
    set({ leaderboard: await leaderboardService.getClassicLeaderboard() });
  },

  applyMatchOutcome: async ({ pointsGained, won, lost, streak, activeRunId }) => {
    const user = get().user;
    if (!user) return;
    const updated: User = {
      ...user,
      totalPoints: user.totalPoints + pointsGained,
      bestStreak: Math.max(user.bestStreak, streak),
      classicWins: user.classicWins + (won ? 1 : 0),
      classicLosses: user.classicLosses + (lost ? 1 : 0),
    };
    await authService.updateUser(updated);
    const leaderboard = await leaderboardService.recordMatchResult({
      userId: user.id,
      username: user.username,
      pointsGained,
      won,
      lost,
      streak,
      activeRunId,
    });
    set({ user: updated, leaderboard });
  },
}));
