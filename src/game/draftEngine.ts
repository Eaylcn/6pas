import type { AnyPlayer, Formation, Position, SquadSlot, BenchSlot } from '../types';
import type { Rng } from '../utils/random';
import { playersByPosition } from '../data';
import { getWeightedRandomRarity, nearbyRarities } from './rarityEngine';

/**
 * Seçilen slot pozisyonuna uygun 3 aday üretir.
 * Kural: aday yalnızca o pozisyondan gelir; daha önce seçilen/gösterilen oyuncular gelmez.
 */
export function generateDraftCandidates(
  rng: Rng,
  position: Position,
  excludeIds: Set<string>,
): AnyPlayer[] {
  const pool = playersByPosition(position);
  const candidates: AnyPlayer[] = [];
  const taken = new Set(excludeIds);

  for (let i = 0; i < 3; i++) {
    const rarity = getWeightedRandomRarity(rng);
    let found: AnyPlayer | null = null;
    for (const r of nearbyRarities(rarity)) {
      const options = pool.filter((p) => p.rarity === r && !taken.has(p.id));
      if (options.length > 0) {
        found = rng.pick(options);
        break;
      }
    }
    if (!found) {
      const any = pool.filter((p) => !taken.has(p.id));
      if (any.length === 0) break;
      found = rng.pick(any);
    }
    taken.add(found.id);
    candidates.push(found);
  }
  return candidates;
}

/** Dizilişe göre ilk 6 slotlarını oluşturur (1 GK + DEF/MID/ATK) */
export function buildSquadSlots(formation: Formation): SquadSlot[] {
  const slots: SquadSlot[] = [{ id: 'gk', position: 'GK', playerId: null }];
  for (let i = 0; i < formation.defSlots; i++) slots.push({ id: `def-${i}`, position: 'DEF', playerId: null });
  for (let i = 0; i < formation.midSlots; i++) slots.push({ id: `mid-${i}`, position: 'MID', playerId: null });
  for (let i = 0; i < formation.atkSlots; i++) slots.push({ id: `atk-${i}`, position: 'ATK', playerId: null });
  return slots;
}

/** 4 yedek: zorunlu 1 Kaleci + 1 Defans + 1 Orta Saha + 1 Atak */
export function buildBenchSlots(): BenchSlot[] {
  return (['GK', 'DEF', 'MID', 'ATK'] as const).map((pos) => ({
    id: `bench-${pos.toLowerCase()}`,
    position: pos,
    playerId: null,
  }));
}

/** İlk seçim kaptan olur — draft akışında ilk dolan slotun oyuncusu */
export function assignCaptainIfFirstPick(currentCaptainId: string | null, pickedPlayerId: string): string {
  return currentCaptainId ?? pickedPlayerId;
}

export function validateSquadByFormation(slots: SquadSlot[], formation: Formation): boolean {
  const filled = slots.filter((s) => s.playerId !== null);
  if (filled.length !== 6) return false;
  const count = (pos: Position) => slots.filter((s) => s.position === pos && s.playerId).length;
  return (
    count('GK') === 1 &&
    count('DEF') === formation.defSlots &&
    count('MID') === formation.midSlots &&
    count('ATK') === formation.atkSlots
  );
}

export function isDraftComplete(slots: SquadSlot[], bench: BenchSlot[]): boolean {
  return slots.every((s) => s.playerId) && bench.every((b) => b.playerId);
}
