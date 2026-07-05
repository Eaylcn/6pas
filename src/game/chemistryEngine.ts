import type { AnyPlayer, ChemistryBreakdown } from '../types';
import { clamp } from '../utils/formatters';

// Kimya sabitleri — denge turunda kalibre edilebilir
const BASE = 50;
const CLUB_PAIR = 8;
const LEAGUE_PAIR = 3;
const NATION_PAIR = 3;
const CAPTAIN_LEAGUE = 2;
const CAPTAIN_NATION = 2;
/** Mevkisi dışında oynayan her oyuncu takım uyumunu bozar */
const OUT_OF_POSITION_PENALTY = 8;

function countPairs(players: AnyPlayer[], key: (p: AnyPlayer) => string): number {
  let pairs = 0;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (key(players[i]) === key(players[j])) pairs++;
    }
  }
  return pairs;
}

export function calculateClubLinks(players: AnyPlayer[]): number {
  return countPairs(players, (p) => p.club);
}

export function calculateLeagueLinks(players: AnyPlayer[]): number {
  // Aynı kulüp çifti zaten kulüp bonusu alıyor; lig bonusu farklı kulüp + aynı lig çiftlerine
  let pairs = 0;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (players[i].league === players[j].league && players[i].club !== players[j].club) pairs++;
    }
  }
  return pairs;
}

export function calculateNationLinks(players: AnyPlayer[]): number {
  return countPairs(players, (p) => p.nationality);
}

export function getChemistryTier(score: number): ChemistryBreakdown['tier'] {
  if (score < 40) return 'kopuk';
  if (score < 60) return 'normal';
  if (score < 80) return 'uyumlu';
  return 'cok-uyumlu';
}

const tierDescriptions: Record<ChemistryBreakdown['tier'], string> = {
  kopuk: 'Kopuk takım',
  normal: 'Normal',
  uyumlu: 'Uyumlu',
  'cok-uyumlu': 'Çok uyumlu',
};

/**
 * Sahadaki 6 oyuncu üzerinden takım kimyası (0-100).
 * Devre arası değişikliklerinden sonra yeniden hesaplanır.
 * outOfPositionCount: mevkisi dışında dizilen oyuncu sayısı (kadro düzenlemeden gelir).
 */
export function calculateTeamChemistry(
  players: AnyPlayer[],
  captainId: string | null,
  outOfPositionCount = 0,
): ChemistryBreakdown {
  const clubLinks = calculateClubLinks(players);
  const leagueLinks = calculateLeagueLinks(players);
  const nationLinks = calculateNationLinks(players);

  let captainLinks = 0;
  const captain = players.find((p) => p.id === captainId);
  let captainLeagueCount = 0;
  let captainNationCount = 0;
  if (captain) {
    for (const p of players) {
      if (p.id === captain.id) continue;
      if (p.league === captain.league) {
        captainLinks += CAPTAIN_LEAGUE;
        captainLeagueCount++;
      }
      if (p.nationality === captain.nationality) {
        captainLinks += CAPTAIN_NATION;
        captainNationCount++;
      }
    }
  }

  const score = clamp(
    BASE +
      clubLinks * CLUB_PAIR +
      leagueLinks * LEAGUE_PAIR +
      nationLinks * NATION_PAIR +
      captainLinks -
      outOfPositionCount * OUT_OF_POSITION_PENALTY,
    0,
    100,
  );
  const tier = getChemistryTier(score);

  const sources: string[] = [];
  if (clubLinks > 0) sources.push(`${clubLinks} oyuncu çifti aynı kulüpten`);
  if (leagueLinks > 0) sources.push(`${leagueLinks} oyuncu çifti aynı ligden`);
  if (nationLinks > 0) sources.push(`${nationLinks} oyuncu çifti aynı uyruktan`);
  if (captainLeagueCount > 0) sources.push(`Kaptanla ${captainLeagueCount} oyuncu aynı ligden`);
  if (captainNationCount > 0) sources.push(`Kaptanla ${captainNationCount} oyuncu aynı uyruktan`);
  if (outOfPositionCount > 0) sources.push(`‼ ${outOfPositionCount} oyuncu mevkisi dışında oynuyor`);
  if (sources.length === 0) sources.push('Kadro henüz ortak bir bağ kurmadı');

  return {
    score,
    tier,
    leagueLinks,
    nationLinks,
    clubLinks,
    captainLinks,
    description: tierDescriptions[tier],
    sources,
  };
}

/** Kimyanın duel skorlarına gizli etkisi */
export function applyChemistryModifier(tier: ChemistryBreakdown['tier']): number {
  switch (tier) {
    case 'kopuk':
      return -2;
    case 'normal':
      return 0;
    case 'uyumlu':
      return 1;
    case 'cok-uyumlu':
      return 2;
  }
}

/** Yüksek kimyanın pozisyon üretimine küçük etkisi (event ağırlığı çarpanı) */
export function chemistryTempoFactor(tier: ChemistryBreakdown['tier']): number {
  switch (tier) {
    case 'kopuk':
      return 0.92;
    case 'normal':
      return 1;
    case 'uyumlu':
      return 1.05;
    case 'cok-uyumlu':
      return 1.1;
  }
}
