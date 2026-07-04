// Puan/streak sistemi — genişletilebilir bonus tanımları.
import type { MatchRewards, PointsBreakdownEntry, TeamMatchInfo } from '../types';
import { getPlayer } from '../data';

const BASE_WIN = 100;

function streakBonus(streakAfterWin: number): number {
  if (streakAfterWin >= 5) return 100;
  switch (streakAfterWin) {
    case 2:
      return 25;
    case 3:
      return 50;
    case 4:
      return 75;
    default:
      return 0;
  }
}

export interface MatchOutcomeInput {
  won: boolean;
  draw: boolean;
  myGoals: number;
  opponentGoals: number;
  streakBeforeMatch: number;
  myPower: number;
  opponentPower: number;
  opponent: TeamMatchInfo;
}

export function calculateRunPoints(input: MatchOutcomeInput): MatchRewards {
  if (!input.won) {
    return { total: 0, breakdown: [], newStreak: input.draw ? input.streakBeforeMatch : 0 };
  }
  const newStreak = input.streakBeforeMatch + 1;
  const breakdown: PointsBreakdownEntry[] = [{ reason: 'Galibiyet', points: BASE_WIN }];

  const sBonus = streakBonus(newStreak);
  if (sBonus > 0) breakdown.push({ reason: `${newStreak} maçlık seri`, points: sBonus });

  if (input.opponentGoals === 0) breakdown.push({ reason: 'Gol yemeden kazanma', points: 20 });
  if (input.myGoals >= 3) breakdown.push({ reason: '3+ gol', points: 20 });
  if (input.myPower <= input.opponentPower - 4) breakdown.push({ reason: 'Güçlü rakibi devirme', points: 30 });

  const oppCaptain = input.opponent.captainId
    ? input.opponent.players.find((p) => p.id === input.opponent.captainId) ??
      (() => {
        try {
          return getPlayer(input.opponent.captainId!);
        } catch {
          return undefined;
        }
      })()
    : undefined;
  if (oppCaptain?.isIcon) breakdown.push({ reason: 'İkon kaptana karşı zafer', points: 25 });

  const total = breakdown.reduce((s, b) => s + b.points, 0);
  return { total, breakdown, newStreak };
}
