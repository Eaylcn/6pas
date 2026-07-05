// Son maç kupürleri (Ö4): HomeDashboard'da mini skor kutuları.
import { load, save } from './storage';

export interface MatchClipping {
  teamName: string;
  opponentName: string;
  score: [number, number];
  penaltyScore: [number, number] | null;
  won: boolean;
  headline: string;
  playedAt: number;
}

const KEY = 'matchHistory';
const MAX_CLIPPINGS = 6;

export async function getClippings(): Promise<MatchClipping[]> {
  return (await load<MatchClipping[]>(KEY)) ?? [];
}

export async function addClipping(clipping: MatchClipping): Promise<MatchClipping[]> {
  const list = [clipping, ...(await getClippings())].slice(0, MAX_CLIPPINGS);
  await save(KEY, list);
  return list;
}
