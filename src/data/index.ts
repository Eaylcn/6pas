import type { AnyPlayer, Position } from '../types';
import { fieldPlayers } from './players';
import { goalkeepers } from './goalkeepers';
import { clubs as clubList } from './clubs';
import { leagues as leagueList } from './leagues';

export { fieldPlayers } from './players';
export { goalkeepers } from './goalkeepers';
export { clubs, clubsOfLeague } from './clubs';
export { leagues } from './leagues';
export { nationalities } from './nationalities';
export { formations, getFormation } from './formations';
export { teamNamePool } from './teams';
export { allPerks, getPerk, perksForPosition } from './perks';

export const allPlayers: AnyPlayer[] = [...fieldPlayers, ...goalkeepers];

const playerMap = new Map<string, AnyPlayer>(allPlayers.map((p) => [p.id, p]));

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
