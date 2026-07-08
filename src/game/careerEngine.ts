// Kariyer (Ana Kadro) modu: zayıf bir kadroyla başla, her galibiyette
// bir mevkiye takviye yap (eski oyuncu gider), kadro kalıcı — kayıpta dağılmaz.
import type { AnyPlayer, BenchSlot, Formation, Position, SquadSlot } from '../types';
import type { Rng } from '../utils/random';
import { playersByPosition } from '../data';

/** Başlangıç kadrosu hedefi: ~62-70 OVR bandı (kademe kademe güçlenecek) */
const STARTER_MAX_OVR = 71;

/** Bir mevkideki en zayıf {n} oyuncudan rastgele biri (deterministik değil) */
function weakPoolFor(position: Position, excludeIds: Set<string>): AnyPlayer[] {
  const pool = playersByPosition(position)
    .filter((p) => !excludeIds.has(p.id) && p.ovr <= STARTER_MAX_OVR)
    .sort((a, b) => a.ovr - b.ovr);
  // Yeterince düşük oyuncu yoksa en zayıf 20'yi al
  if (pool.length < 6) {
    return playersByPosition(position)
      .filter((p) => !excludeIds.has(p.id))
      .sort((a, b) => a.ovr - b.ovr)
      .slice(0, 24);
  }
  return pool;
}

export interface StarterSquad {
  squad: SquadSlot[];
  bench: BenchSlot[];
  captainId: string;
}

/** Dizilişe göre zayıf başlangıç kadrosu + 4 yedek üretir; kaptan en tecrübeli (yaşça) */
export function buildStarterSquad(rng: Rng, formation: Formation): StarterSquad {
  const used = new Set<string>();
  const pickWeak = (position: Position): AnyPlayer => {
    const pool = weakPoolFor(position, used);
    const player = rng.pick(pool.slice(0, Math.min(pool.length, 18)));
    used.add(player.id);
    return player;
  };

  const squad: SquadSlot[] = [];
  const gk = pickWeak('GK');
  squad.push({ id: 'gk', position: 'GK', playerId: gk.id });
  for (let i = 0; i < formation.defSlots; i++) squad.push({ id: `def-${i}`, position: 'DEF', playerId: pickWeak('DEF').id });
  for (let i = 0; i < formation.midSlots; i++) squad.push({ id: `mid-${i}`, position: 'MID', playerId: pickWeak('MID').id });
  for (let i = 0; i < formation.atkSlots; i++) squad.push({ id: `atk-${i}`, position: 'ATK', playerId: pickWeak('ATK').id });

  const bench: BenchSlot[] = (['GK', 'DEF', 'MID', 'ATK'] as const).map((pos) => ({
    id: `bench-${pos.toLowerCase()}`,
    position: pos,
    playerId: pickWeak(pos).id,
  }));

  // Kaptan: ilk 6'nın en yüksek OVR'lisi (takımın çekirdeği)
  const captainId = squad
    .map((s) => s.playerId!)
    .reduce((best, id) => {
      const cur = allById(id);
      const bestP = allById(best);
      return cur && bestP && cur.ovr > bestP.ovr ? id : best;
    });

  return { squad, bench, captainId };
}

function allById(id: string): AnyPlayer | null {
  for (const pos of ['GK', 'DEF', 'MID', 'ATK'] as const) {
    const found = playersByPosition(pos).find((p) => p.id === id);
    if (found) return found;
  }
  return null;
}

export interface Reinforcement {
  incoming: AnyPlayer;
  /** Kadrodan çıkacak oyuncu id'si */
  outgoingId: string;
  /** Çıkan oyuncu ilk 11'de miydi (takviye sahaya girdi mi) */
  outgoingWasStarter: boolean;
}

function weakestAmong(ids: string[], position: Position): AnyPlayer | null {
  const atPos = ids
    .map((id) => allById(id))
    .filter((p): p is AnyPlayer => p !== null && p.position === position);
  if (atPos.length === 0) return null;
  return atPos.reduce((a, b) => (b.ovr < a.ovr ? b : a));
}

/** Bir mevkinin değişecek oyuncusu — ÖNCE ilk 11, yoksa yedek (görünür güçlenme) */
export function reinforcementOutgoing(
  starterIds: string[],
  benchIds: string[],
  position: Position,
): { player: AnyPlayer; isStarter: boolean } | null {
  const starter = weakestAmong(starterIds, position);
  if (starter) return { player: starter, isStarter: true };
  const benched = weakestAmong(benchIds, position);
  if (benched) return { player: benched, isStarter: false };
  return null;
}

/**
 * Seçilen mevki için takviye: ilk 11'deki (yoksa yedekteki) en zayıf oyuncudan
 * belirgin biçimde daha iyi biri gelir. Hedef OVR galibiyetle yükselir (rampa).
 */
export function pickReinforcement(
  rng: Rng,
  starterIds: string[],
  benchIds: string[],
  position: Position,
  wins: number,
): Reinforcement | null {
  const outgoing = reinforcementOutgoing(starterIds, benchIds, position);
  if (!outgoing) return null;
  const owned = new Set([...starterIds, ...benchIds]);

  // Hedef band: çıkan oyuncunun üstünde, galibiyetle yükselen bir taban
  const floor = Math.max(outgoing.player.ovr + 2, 66 + wins * 2);
  const ceiling = floor + 6;

  const candidates = playersByPosition(position)
    .filter((p) => !owned.has(p.id) && p.ovr >= floor && p.ovr <= ceiling)
    .sort((a, b) => a.ovr - b.ovr);

  let incoming: AnyPlayer | null = null;
  if (candidates.length > 0) {
    incoming = rng.pick(candidates.slice(0, Math.min(candidates.length, 10)));
  } else {
    // Band boşsa: sahip olunmayan, çıkandan güçlü en yakın oyuncu
    const fallback = playersByPosition(position)
      .filter((p) => !owned.has(p.id) && p.ovr > outgoing.player.ovr)
      .sort((a, b) => a.ovr - b.ovr);
    incoming = fallback[0] ?? null;
  }
  if (!incoming) return null;
  return { incoming, outgoingId: outgoing.player.id, outgoingWasStarter: outgoing.isStarter };
}
