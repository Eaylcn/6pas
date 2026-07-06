import { create } from 'zustand';
import type { LeaderboardEntry, User } from '../types';
import * as authService from '../services/authService';
import * as leaderboardService from '../services/leaderboardService';

interface UserState {
  user: User | null;
  leaderboard: LeaderboardEntry[];
  tournamentBoard: LeaderboardEntry[];
  initialized: boolean;
  init: () => Promise<void>;
  login: (username: string, password?: string) => Promise<User>;
  register: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  applyMatchOutcome: (input: {
    mode: 'classic' | 'tournament';
    pointsGained: number;
    won: boolean;
    lost: boolean;
    streak: number;
    activeRunId: string | null;
    /** Turnuvada ulaşılan tur (kazanılan tur sayısı) */
    stageReached?: number;
  }) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  leaderboard: [],
  tournamentBoard: [],
  initialized: false,

  init: async () => {
    const user = await authService.getCurrentUser();
    const leaderboard = await leaderboardService.getLeaderboard('classic');
    const tournamentBoard = await leaderboardService.getLeaderboard('tournament');
    set({ user, leaderboard, tournamentBoard, initialized: true });
  },

  login: async (username: string, password?: string) => {
    const user = await authService.login(username.trim(), password);
    set({ user });
    return user;
  },

  register: async (username: string, password: string) => {
    const user = await authService.register(username.trim(), password);
    set({ user });
    return user;
  },

  logout: async () => {
    await authService.logout();
    set({ user: null });
  },

  refreshLeaderboard: async () => {
    set({
      leaderboard: await leaderboardService.getLeaderboard('classic'),
      tournamentBoard: await leaderboardService.getLeaderboard('tournament'),
    });
  },

  applyMatchOutcome: async ({ mode, pointsGained, won, lost, streak, activeRunId, stageReached }) => {
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
    const board = await leaderboardService.recordMatchResult(mode, {
      userId: user.id,
      username: user.username,
      pointsGained,
      won,
      lost,
      streak,
      activeRunId,
      stageReached,
    });
    if (mode === 'classic') set({ user: updated, leaderboard: board });
    else set({ user: updated, tournamentBoard: board });
  },
}));
