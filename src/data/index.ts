import type { AnyPlayer, Position } from '../types';
import { fieldPlayers as fakeFieldPlayers } from './players';
import { goalkeepers as fakeGoalkeepers } from './goalkeepers';
import { realFieldPlayers, realGoalkeepers } from './realPlayers';
import { isRealModeEnabled } from './realMode';
import { clubs as clubList } from './clubs';
import { leagues as leagueList } from './leagues';

export { clubs, clubsOfLeague } from './clubs';
export { leagues } from './leagues';
export { nationalities } from './nationalities';
export { formations, getFormation } from './formations';
export { teamNamePool } from './teams';
export { allPerks, getPerk, perksForPosition } from './perks';

// Aktif havuz: Gerçek Yıldızlar Modu açıksa tamamı gerçek kadrolar
const realMode = isRealModeEnabled();
export const fieldPlayers = realMode ? realFieldPlayers : fakeFieldPlayers;
export const goalkeepers = realMode ? realGoalkeepers : fakeGoalkeepers;

export const allPlayers: AnyPlayer[] = [...fieldPlayers, ...goalkeepers];

// Denge kuralı: bir oyuncuda en fazla 2 perk (belirginlik + denge)
for (const p of [...fakeFieldPlayers, ...fakeGoalkeepers, ...realFieldPlayers, ...realGoalkeepers]) {
  if (p.perks.length > 2) p.perks = p.perks.slice(0, 2);
}

// Arama haritası HER İKİ havuzu da içerir: mod değişse bile eski kayıtlı
// run'lardaki oyuncu id'leri çözülebilir kalır.
const playerMap = new Map<string, AnyPlayer>(
  [...fakeFieldPlayers, ...fakeGoalkeepers, ...realFieldPlayers, ...realGoalkeepers].map((p) => [p.id, p]),
);

export function getPlayer(id: string): AnyPlayer {
  const p = playerMap.get(id);
  if (!p) throw new Error(`Bilinmeyen oyuncu: ${id}`);
  return p;
}

export function playersByPosition(position: Position): AnyPlayer[] {
  return position === 'GK' ? goalkeepers : fieldPlayers.filter((p) => p.position === position);
}

export function getClubName(clubId: string): string {
  return clubList.find((c) => c.id === clubId)?.name ?? clubId;
}

export function getLeagueName(leagueId: string): string {
  return leagueList.find((l) => l.id === leagueId)?.name ?? leagueId;
}
