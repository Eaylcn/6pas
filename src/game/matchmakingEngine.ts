// Ghost rakip üretimi — oyuncuyla aynı draft kurallarıyla otomatik kadro kurar.
// İleride gerçek matchmakingQueue servisi bu modülün arayüzünü koruyarak devreye girer.
import type { AnyPlayer, PlayStyle, TacticalPlan, TeamMatchInfo } from '../types';
import type { Rng } from '../utils/random';
import { formations } from '../data/formations';
import { teamNamePool } from '../data/teams';
import { generateDraftCandidates, buildSquadSlots } from './draftEngine';
import { calculateTeamChemistry } from './chemistryEngine';
import { calculateTeamPower } from './matchEngine';

const styles: PlayStyle[] = ['ofansif', 'dengeli', 'defansif', 'kontra'];

function randomPlan(rng: Rng): TacticalPlan {
  return {
    whenWinning: rng.pick(['defansif', 'dengeli', 'kontra'] as PlayStyle[]),
    whenDrawing: rng.pick(styles),
    whenLosing: rng.pick(['ofansif', 'dengeli'] as PlayStyle[]),
  };
}

export function generateGhostOpponent(rng: Rng, avoidName?: string): TeamMatchInfo {
  const formation = rng.pick(formations);
  const slots = buildSquadSlots(formation);
  const exclude = new Set<string>();
  const players: AnyPlayer[] = [];
  let captainId: string | null = null;

  // Ghost, insan gibi draft yapar: her slot için 3 aday, birini seçer
  for (const slot of rng.shuffle(slots)) {
    const candidates = generateDraftCandidates(rng, slot.position, exclude);
    if (candidates.length === 0) continue;
    // Ghost çoğunlukla en yüksek OVR'yi seçer ama bazen "his"le oynar
    const pick = rng.chance(0.7)
      ? candidates.reduce((a, b) => (b.ovr > a.ovr ? b : a))
      : rng.pick(candidates);
    players.push(pick);
    exclude.add(pick.id);
    for (const c of candidates) exclude.add(c.id);
    if (!captainId) captainId = pick.id;
  }

  const bench: AnyPlayer[] = [];
  const benchPositions = ['ATK', 'MID', 'DEF'] as const;
  for (const pos of benchPositions) {
    const candidates = generateDraftCandidates(rng, pos, exclude);
    if (candidates.length === 0) continue;
    const pick = rng.pick(candidates);
    bench.push(pick);
    exclude.add(pick.id);
  }

  const namePool = teamNamePool.filter((n) => n !== avoidName);
  const chemistry = calculateTeamChemistry(players, captainId);
  const info: TeamMatchInfo = {
    teamName: rng.pick(namePool),
    formationId: formation.id,
    defaultPlayStyle: rng.pick(styles),
    tacticalPlan: randomPlan(rng),
    players,
    bench,
    captainId,
    chemistry,
    isGhost: true,
    power: 0,
  };
  info.power = calculateTeamPower(info);
  return info;
}

/**
 * Oyuncunun gücüne yakın (±5 bandında) ghost arar; 6 denemede en yakını döner.
 * Bilinçli küçük sapmalar underdog/overdog bonuslarını mümkün kılar.
 */
export function findMatchForRun(rng: Rng, playerPower: number, avoidName?: string): TeamMatchInfo {
  let best: TeamMatchInfo | null = null;
  let bestDiff = Infinity;
  for (let i = 0; i < 6; i++) {
    const ghost = generateGhostOpponent(rng, avoidName);
    const diff = Math.abs(ghost.power - playerPower);
    if (diff < bestDiff) {
      best = ghost;
      bestDiff = diff;
    }
    if (diff <= 5) break;
  }
  return best!;
}

export function matchByTeamPower(playerPower: number, ghostPower: number): 'underdog' | 'even' | 'favorite' {
  if (playerPower <= ghostPower - 4) return 'underdog';
  if (playerPower >= ghostPower + 4) return 'favorite';
  return 'even';
}
