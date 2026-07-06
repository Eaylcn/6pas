// Son maç kupürleri + run geçmişi: HomeDashboard'da mini skor kutuları ve "Geçmişim".
import type { GameMode } from '../types';
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

// ---- Run geçmişi: hangi takımla nereye kadar gidildi ----
export interface RunRecord {
  id: string;
  mode: GameMode;
  teamName: string;
  captainName: string | null;
  wins: number;
  losses: number;
  /** "4 galibiyetlik seri" (klasik) veya "Çeyrek Final turunda elendi" / "🏆 ŞAMPİYON" (turnuva) */
  resultLabel: string;
  champion: boolean;
  points: number;
  endedAt: number;
}

const RUNS_KEY = 'runHistory';
const MAX_RUNS = 20;

export async function getRunHistory(): Promise<RunRecord[]> {
  return (await load<RunRecord[]>(RUNS_KEY)) ?? [];
}

export async function addRunRecord(record: RunRecord): Promise<RunRecord[]> {
  const list = [record, ...(await getRunHistory())].slice(0, MAX_RUNS);
  await save(RUNS_KEY, list);
  return list;
}
