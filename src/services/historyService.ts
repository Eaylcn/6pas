// Son maç kupürleri + run geçmişi: HomeDashboard'da mini skor kutuları ve "Geçmişim".
// Kupürler her zaman lokal; run geçmişi online modda hesaba (Supabase) yazılır.
import type { GameMode } from '../types';
import { load, save } from './storage';
import { isOnline, supabase } from './supabaseClient';

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

interface RunHistoryRow {
  id: string;
  mode: string;
  team_name: string;
  captain_name: string | null;
  wins: number;
  losses: number;
  result_label: string;
  champion: boolean;
  points: number;
  ended_at: string;
}

function mapRunRow(row: RunHistoryRow): RunRecord {
  return {
    id: row.id,
    mode: (row.mode === 'tournament' ? 'tournament' : 'classic') as GameMode,
    teamName: row.team_name,
    captainName: row.captain_name,
    wins: row.wins,
    losses: row.losses,
    resultLabel: row.result_label,
    champion: row.champion,
    points: row.points,
    endedAt: Date.parse(row.ended_at) || Date.now(),
  };
}

export async function getRunHistory(): Promise<RunRecord[]> {
  if (isOnline) {
    try {
      const { data, error } = await supabase()
        .from('run_history')
        .select('*')
        .order('ended_at', { ascending: false })
        .limit(MAX_RUNS);
      if (error || !data) return [];
      return (data as RunHistoryRow[]).map(mapRunRow);
    } catch {
      return [];
    }
  }
  return (await load<RunRecord[]>(RUNS_KEY)) ?? [];
}

export async function addRunRecord(record: RunRecord): Promise<RunRecord[]> {
  if (isOnline) {
    try {
      const { data: auth } = await supabase().auth.getUser();
      if (auth.user) {
        const { error } = await supabase().from('run_history').insert({
          user_id: auth.user.id,
          mode: record.mode,
          team_name: record.teamName,
          captain_name: record.captainName,
          wins: record.wins,
          losses: record.losses,
          result_label: record.resultLabel,
          champion: record.champion,
          points: record.points,
        });
        if (error) console.error('Geçmiş kaydedilemedi:', error.message);
      }
    } catch (e) {
      console.error('Geçmiş kaydedilemedi (ağ):', e);
    }
    return getRunHistory();
  }
  const list = [record, ...(await getRunHistory())].slice(0, MAX_RUNS);
  await save(RUNS_KEY, list);
  return list;
}
