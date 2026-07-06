// 6Pas: Draft Arena — merkezi tip tanımları

export type Position = 'GK' | 'DEF' | 'MID' | 'ATK';
export type FieldPosition = 'DEF' | 'MID' | 'ATK';

export type Rarity = 'common' | 'solid' | 'pro' | 'star' | 'legend' | 'icon';

export type PlayStyle = 'ofansif' | 'dengeli' | 'defansif' | 'kontra';

export type GameMode = 'classic' | 'ranked' | 'tournament';

export interface Perk {
  id: string;
  name: string;
  positionType: Position;
  description: string;
  triggerEvents: MatchEventType[];
  bonusType: 'attack' | 'defense' | 'save' | 'playmaking';
  bonusValue: number;
  counters: string[]; // nötralize ettiği perk id'leri
  rarityWeight: number;
  narrationHints: string[]; // anlatım motoruna şablon anahtarı
}

interface PlayerBase {
  id: string;
  name: string;
  rarity: Rarity;
  ovr: number;
  nationality: string;
  league: string;
  club: string;
  age?: number;
  perks: string[]; // perk id listesi
  isIcon: boolean;
  flavorText: string;
  /** Esin kaynağı — UI'da ASLA gösterilmez */
  inspiredBy?: string;
  captainTrait?: string;
}

export interface FieldPlayer extends PlayerBase {
  position: FieldPosition;
  atk: number;
  mid: number;
  def: number;
}

export interface Goalkeeper extends PlayerBase {
  position: 'GK';
  ref: number;
  command: number;
  distribution: number;
}

export type AnyPlayer = FieldPlayer | Goalkeeper;

export function isGoalkeeper(p: AnyPlayer): p is Goalkeeper {
  return p.position === 'GK';
}

export interface Formation {
  id: string;
  name: string;
  defSlots: number;
  midSlots: number;
  atkSlots: number;
  description: string;
  playStyleAffinity: PlayStyle;
}

export interface TacticalPlan {
  whenWinning: PlayStyle;
  whenDrawing: PlayStyle;
  whenLosing: PlayStyle;
}

export interface SquadSlot {
  id: string;
  position: Position;
  playerId: string | null;
}

export interface BenchSlot {
  id: string;
  /** v0.3: 4 yedek — zorunlu 1 GK + 1 DEF + 1 MID + 1 ATK */
  position: Position | null;
  playerId: string | null;
}

export interface ChemistryBreakdown {
  score: number;
  tier: 'kopuk' | 'normal' | 'uyumlu' | 'cok-uyumlu';
  leagueLinks: number;
  nationLinks: number;
  clubLinks: number;
  captainLinks: number;
  description: string;
  sources: string[]; // UI'da gösterilen kaynak listesi
}

export type RunStatus = 'active' | 'eliminated' | 'completed';

export interface Run {
  id: string;
  userId: string;
  mode: GameMode;
  teamName: string;
  formationId: string;
  defaultPlayStyle: PlayStyle;
  tacticalPlan: TacticalPlan;
  squad: SquadSlot[];
  bench: BenchSlot[];
  captainId: string | null;
  chemistry: ChemistryBreakdown;
  wins: number;
  losses: number;
  streak: number;
  pointsEarned: number;
  status: RunStatus;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  username: string;
  totalPoints: number;
  bestStreak: number;
  classicWins: number;
  classicLosses: number;
  rankedRating?: number;
  createdAt: number;
}

// ---- Maç ----

export type MatchEventType =
  | 'calim' // çalım / dribbling hamlesi
  | 'ara-pas'
  | 'ters-top'
  | 'uzaktan-sut'
  | 'dar-aci'
  | 'karsi-karsiya'
  | 'rovasata'
  | 'rabona'
  | 'plase'
  | 'kafa'
  | 'korner'
  | 'kontra'
  | 'blok'
  | 'cizgiden'
  | 'kurtaris'
  | 'son-dakika'
  // Duran toplar ve meta olaylar
  | 'serbest-vurus'
  | 'penalti'
  | 'faul'
  | 'sakatlik'
  | 'degisiklik'
  | 'taktik'
  | 'gerginlik';

export type EventResult =
  | 'goal'
  | 'save'
  | 'miss'
  | 'blocked'
  | 'corner-won'
  | 'defended'
  | 'foul'
  | 'injury'
  | 'substitution'
  | 'tactic-shift'
  | 'scuffle';

export interface TeamMatchInfo {
  runId?: string;
  teamName: string;
  /** Teknik direktör (kullanıcı adı veya ghost TD ismi) */
  managerName?: string;
  formationId: string;
  defaultPlayStyle: PlayStyle;
  tacticalPlan: TacticalPlan;
  players: AnyPlayer[]; // sahadaki 6
  bench: AnyPlayer[];
  captainId: string | null;
  chemistry: ChemistryBreakdown;
  isGhost: boolean;
  power: number;
}

export interface HiddenRoll {
  label: string;
  value: number;
}

export interface MatchEvent {
  minute: number;
  half: 1 | 2;
  type: MatchEventType;
  attackingTeam: 'home' | 'away';
  defendingTeam: 'home' | 'away';
  playersInvolved: string[]; // oyuncu id'leri
  hiddenPerksTriggered: string[]; // debug — UI'da gösterilmez
  hiddenDiceRolls: HiddenRoll[]; // debug — UI'da gösterilmez
  textLines: string[];
  result: EventResult;
  scoreAfterEvent: [number, number];
  // Meta olay alanları (kart / sakatlık / değişiklik / duran top)
  card?: 'yellow' | 'red';
  cardPlayerId?: string;
  injuryPlayerId?: string;
  subOutId?: string;
  subInId?: string;
  /** Gol duran toptan mu geldi (P: penaltı, SV: serbest vuruş) */
  setPiece?: 'pen' | 'fk';
  /** Maç içi penaltıda vuruş detayı (anlatım + görsel uyumu) */
  pen?: PenaltyDetail;
}

export interface HalftimeState {
  scoreAtHalf: [number, number];
  summary: string[];
  homeSubsUsed: number;
  awaySubsUsed: number;
}

export interface MatchRecord {
  id: string;
  mode: GameMode;
  homeRunId?: string;
  awayRunId?: string;
  home: TeamMatchInfo;
  away: TeamMatchInfo;
  events: MatchEvent[];
  halftimeState: HalftimeState | null;
  finalScore: [number, number];
  winner: 'home' | 'away' | 'draw';
  pointsAwarded: number;
  manOfTheMatch: string | null;
  criticalMoment: string | null;
  createdAt: number;
  /** İleride hava koşulları buradan devreye girecek — MVP'de nötr */
  weatherModifier: WeatherModifier;
}

export interface WeatherModifier {
  id: string;
  passAccuracy: number;
  shotControl: number;
  gkErrorChance: number;
  longShot: number;
  chemistryEffect: number;
}

/** Penaltı vuruş detayı — anlatım ve canlı kale sahnesi AYNI kaynaktan beslenir */
export type PenSide = 'L' | 'C' | 'R';
export interface PenaltyDetail {
  /** Vuruşun gittiği yön */
  shotX: PenSide;
  /** Üst köşe mi, yerden mi */
  high: boolean;
  /** Kalecinin hamlesi (C = yerinde kaldı) */
  diveX: PenSide;
  /** Kaçan vuruşun şekli */
  out?: 'bar' | 'post';
}

export interface PenaltyKickLine {
  text: string;
  emphasis: 'normal' | 'suspense' | 'goal' | 'save' | 'miss';
  /** Vuruşu kullanan taraf — canlı saha ve takım etiketi için */
  side?: 'home' | 'away';
  /** Sonuç satırında vuruş detayı (görsel sahne bununla oynar) */
  pen?: PenaltyDetail;
}

export interface PenaltyShootoutResult {
  homeGoals: number;
  awayGoals: number;
  winner: 'home' | 'away';
  lines: PenaltyKickLine[];
}

export interface PointsBreakdownEntry {
  reason: string;
  points: number;
}

export interface MatchRewards {
  total: number;
  breakdown: PointsBreakdownEntry[];
  newStreak: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  bestStreak: number;
  /** Turnuva tablosu: ulaşılan en iyi tur (kazanılan tur sayısı, 5 = şampiyon) */
  bestStage?: number;
  totalWins: number;
  totalLosses: number;
  matchesPlayed: number;
  currentActiveRunId: string | null;
  isBot?: boolean;
}

// ---- Draft ----

export interface DraftCandidateSet {
  slotId: string;
  position: Position;
  candidates: AnyPlayer[];
}

export type ScreenId =
  | 'login'
  | 'home'
  | 'mode-select'
  | 'team-name'
  | 'formation'
  | 'tactics'
  | 'draft'
  | 'squad-review'
  | 'matchmaking'
  | 'match'
  | 'half-time'
  | 'match-result'
  | 'leaderboard';
