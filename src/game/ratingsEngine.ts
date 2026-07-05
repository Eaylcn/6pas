// SofaScore tarzı oyuncu maç reytingleri (4.5 - 10.0).
// Event katkılarından türetilir; motora dokunmaz.
import type { AnyPlayer, MatchEvent } from '../types';
import { isGoalkeeper } from '../types';
import type { SimTeamState } from './matchEngine';
import { clamp } from '../utils/formatters';
import { getPlayer } from '../data';

const BASE = 6.0;

interface Tally {
  delta: number;
  goals: number;
  assists: number;
  saves: number;
}

export interface PlayerRating {
  player: AnyPlayer;
  rating: number;
  goals: number;
  assists: number;
  saves: number;
}

export function computeMatchRatings(events: MatchEvent[], state: SimTeamState, side: 'home' | 'away'): PlayerRating[] {
  const tallies = new Map<string, Tally>();
  const bump = (id: string | undefined, delta: number, kind?: 'goal' | 'assist' | 'save') => {
    if (!id) return;
    const t = tallies.get(id) ?? { delta: 0, goals: 0, assists: 0, saves: 0 };
    t.delta += delta;
    if (kind === 'goal') t.goals++;
    if (kind === 'assist') t.assists++;
    if (kind === 'save') t.saves++;
    tallies.set(id, t);
  };

  for (const e of events) {
    const attacking = e.attackingTeam === side;
    const defending = e.defendingTeam === side;
    const [first, second, third] = e.playersInvolved;
    const gkId = e.playersInvolved[e.playersInvolved.length - 1];

    switch (e.result) {
      case 'goal':
        if (attacking) {
          bump(first, 1.2, 'goal');
          if (second && second !== first) bump(second, 0.6, 'assist');
        }
        if (defending) bump(gkId, -0.2); // kaleci golü yedi
        break;
      case 'save':
        if (defending) bump(gkId, 0.6, 'save');
        if (attacking) bump(first, 0.1); // isabetli şut yine de katkı
        break;
      case 'miss':
        if (attacking) bump(first, -0.2);
        break;
      case 'blocked':
      case 'defended':
        if (defending) bump(third, 0.4);
        break;
      case 'corner-won':
        if (attacking) bump(first, 0.15);
        break;
      case 'foul':
        if (defending) {
          bump(e.cardPlayerId ?? second, e.card === 'red' ? -1.2 : e.card === 'yellow' ? -0.3 : -0.15);
        }
        break;
      default:
        break;
    }
    // Perk tetiklenmesi: imza hareketi küçük katkı
    if (e.hiddenPerksTriggered.length > 0 && (e.result === 'goal' || e.result === 'save' || e.result === 'blocked')) {
      if (attacking && e.result === 'goal') bump(first, 0.1);
      if (defending && e.result === 'save') bump(gkId, 0.1);
      if (defending && e.result === 'blocked') bump(third, 0.1);
    }
  }

  // Kadro: sahadakiler + oyundan çıkanlar (değişiklik/sakatlık/kırmızı)
  const roster = new Map<string, AnyPlayer>();
  for (const p of state.info.players) roster.set(p.id, p);
  const leftIds = new Set<string>([...state.sentOffIds, ...state.injuredIds]);
  for (const e of events) {
    if (e.attackingTeam === side && e.subOutId) leftIds.add(e.subOutId);
  }
  for (const id of leftIds) {
    try {
      if (!roster.has(id)) roster.set(id, getPlayer(id));
    } catch {
      // havuzda bulunamazsa karneye girmez
    }
  }

  const ratings: PlayerRating[] = [...roster.values()].map((player) => {
    const t = tallies.get(player.id) ?? { delta: 0, goals: 0, assists: 0, saves: 0 };
    // Kaleciye temiz maç bonusu
    let cleanSheet = 0;
    if (isGoalkeeper(player)) {
      const conceded = events.filter((e) => e.defendingTeam === side && e.result === 'goal').length;
      if (conceded === 0) cleanSheet = 0.5;
    }
    return {
      player,
      rating: Math.round(clamp(BASE + t.delta + cleanSheet, 4.5, 10) * 10) / 10,
      goals: t.goals,
      assists: t.assists,
      saves: t.saves,
    };
  });

  return ratings.sort((a, b) => b.rating - a.rating);
}

export function ratingTone(rating: number): 'great' | 'good' | 'poor' {
  if (rating >= 7.5) return 'great';
  if (rating >= 6.0) return 'good';
  return 'poor';
}
