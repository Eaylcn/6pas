// Puan tabloları: online modda Supabase profiles tablosundan CANLI okunur,
// değilse localStorage mock'u (bot tohumlu) kullanılır.
import type { LeaderboardEntry } from '../types';
import { seedBots, seedTournamentBots, sortLeaderboard, updateLeaderboardAfterMatch } from '../game/leaderboardEngine';
import { load, save } from './storage';
import { isOnline, supabase } from './supabaseClient';

export type LeaderboardMode = 'classic' | 'tournament';

const KEYS: Record<LeaderboardMode, string> = {
  classic: 'leaderboard:classic',
  tournament: 'leaderboard:tournament',
};

interface ProfileStatsRow {
  id: string;
  username: string;
  classic_points: number;
  classic_best_streak: number;
  classic_wins: number;
  classic_losses: number;
  tour_points: number;
  tour_best_stage: number;
  tour_wins: number;
  tour_losses: number;
}

function mapRow(mode: LeaderboardMode, row: ProfileStatsRow): LeaderboardEntry {
  const wins = mode === 'classic' ? row.classic_wins : row.tour_wins;
  const losses = mode === 'classic' ? row.classic_losses : row.tour_losses;
  return {
    userId: row.id,
    username: row.username,
    totalPoints: mode === 'classic' ? row.classic_points : row.tour_points,
    bestStreak: row.classic_best_streak,
    bestStage: row.tour_best_stage,
    totalWins: wins,
    totalLosses: losses,
    matchesPlayed: wins + losses,
    currentActiveRunId: null,
  };
}

export async function getLeaderboard(mode: LeaderboardMode): Promise<LeaderboardEntry[]> {
  if (isOnline) {
    // Ağ hatası açılışı asla kilitlemesin — boş tabloyla devam edilir
    try {
      const orderCol = mode === 'classic' ? 'classic_points' : 'tour_points';
      const { data, error } = await supabase()
        .from('profiles')
        .select('id, username, classic_points, classic_best_streak, classic_wins, classic_losses, tour_points, tour_best_stage, tour_wins, tour_losses')
        .order(orderCol, { ascending: false })
        .limit(50);
      if (error || !data) return [];
      return (data as ProfileStatsRow[]).map((row) => mapRow(mode, row));
    } catch {
      return [];
    }
  }

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
  if (isOnline) {
    // Atomik sunucu güncellemesi — istemci toplama yapmaz
    try {
      const { error } = await supabase().rpc('apply_match_outcome', {
        p_mode: mode,
        p_points: update.pointsGained,
        p_won: update.won,
        p_streak: update.streak,
        p_stage: update.stageReached ?? 0,
      });
      if (error) console.error('Stat güncellenemedi:', error.message);
    } catch (e) {
      console.error('Stat güncellenemedi (ağ):', e);
    }
    return getLeaderboard(mode);
  }

  const entries = await getLeaderboard(mode);
  const updated = updateLeaderboardAfterMatch(entries, update);
  await save(KEYS[mode], updated);
  return updated;
}
