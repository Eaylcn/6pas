import { create } from 'zustand';
import type {
  AnyPlayer,
  BenchSlot,
  FieldPosition,
  MatchEvent,
  MatchRewards,
  PlayStyle,
  Position,
  Run,
  ScreenId,
  SquadSlot,
  TacticalPlan,
  TeamMatchInfo,
} from '../types';
import { getFormation, getPlayer, teamNamePool } from '../data';
import { createRng, randomSeed, type Rng } from '../utils/random';
import {
  assignCaptainIfFirstPick,
  buildBenchSlots,
  buildSquadSlots,
  generateDraftCandidates,
  isDraftComplete,
} from '../game/draftEngine';
import { calculateTeamChemistry } from '../game/chemistryEngine';
import {
  calculateTeamPower,
  createNarrationEngine,
  generateExtraTimeEvents,
  generateMatchEvents,
  pickCriticalMoment,
  pickManOfTheMatch,
  simulatePenaltyShootout,
  type SimTeamState,
} from '../game/matchEngine';
import type { PenaltyShootoutResult } from '../types';
import type { NarrationEngine } from '../game/narrationEngine';
import { generateHalfTimeSummary, applySubstitution, validateSubstitution, MAX_SUBSTITUTIONS } from '../game/halftimeEngine';
import { calculateRunPoints } from '../game/scoringEngine';
import * as runService from '../services/runService';
import * as matchmakingService from '../services/matchmakingService';
import { useUserStore } from './useUserStore';

// ---- Maç oturumu (serileştirilmez; sayfa yenilenirse maç düşer, run korunur) ----
interface MatchSession {
  rng: Rng;
  narration: NarrationEngine;
  home: SimTeamState;
  away: SimTeamState;
  firstHalfEvents: MatchEvent[];
  secondHalfEvents: MatchEvent[] | null;
  extraTimeEvents: MatchEvent[] | null;
  penalties: PenaltyShootoutResult | null;
  subsUsed: number;
}

export type MatchPhase = 'H1' | 'H2' | 'ET' | 'PENS';

export function phaseOf(session: MatchSession): MatchPhase {
  if (session.penalties) return 'PENS';
  if (session.extraTimeEvents) return 'ET';
  if (session.secondHalfEvents) return 'H2';
  return 'H1';
}

interface GameState {
  screen: ScreenId;
  booting: boolean;
  run: Run | null;

  // Draft akışı
  draftTeamName: string;
  draftFormationId: string;
  draftPlayStyle: PlayStyle;
  draftPlan: TacticalPlan;
  squadSlots: SquadSlot[];
  benchSlots: BenchSlot[];
  captainId: string | null;
  activeSlotId: string | null;
  activeSlotPosition: Position | null;
  candidates: AnyPlayer[] | null;
  benchPositionPending: string | null; // pozisyon seçimi bekleyen yedek slotu

  // Maç
  opponent: TeamMatchInfo | null;
  opponentFound: boolean;
  session: MatchSession | null;
  halftimeSummary: string[];
  rewards: MatchRewards | null;
  finalScore: [number, number] | null;
  penaltyScore: [number, number] | null;
  playerWon: boolean;
  playerDraw: boolean;
  manOfTheMatch: string | null;
  criticalMoment: string | null;

  // Aksiyonlar
  init: () => Promise<void>;
  goto: (screen: ScreenId) => void;
  startNewTeamFlow: () => void;
  setTeamName: (name: string) => void;
  suggestTeamName: () => void;
  setFormation: (formationId: string) => void;
  setPlayStyle: (style: PlayStyle) => void;
  setPlan: (updates: Partial<TacticalPlan>) => void;
  confirmTactics: () => void;
  openSlot: (slotId: string) => void;
  chooseBenchPosition: (slotId: string, position: FieldPosition) => void;
  pickCandidate: (playerId: string) => Promise<void>;
  findMatch: () => Promise<void>;
  startMatch: () => void;
  reachHalftime: () => void;
  halftimeSetPlayStyle: (style: PlayStyle) => void;
  halftimeSetPlan: (updates: Partial<TacticalPlan>) => void;
  makeSubstitution: (outId: string, inId: string) => string | null;
  startSecondHalf: () => void;
  afterSecondHalf: () => Promise<void>;
  afterExtraTime: () => Promise<void>;
  finishMatch: () => Promise<void>;
  afterResult: () => Promise<void>;
}

const defaultPlan: TacticalPlan = { whenWinning: 'dengeli', whenDrawing: 'dengeli', whenLosing: 'ofansif' };

function playerTeamInfo(run: Run): TeamMatchInfo {
  const players = run.squad.filter((s) => s.playerId).map((s) => getPlayer(s.playerId!));
  const bench = run.bench.filter((b) => b.playerId).map((b) => getPlayer(b.playerId!));
  const info: TeamMatchInfo = {
    runId: run.id,
    teamName: run.teamName,
    formationId: run.formationId,
    defaultPlayStyle: run.defaultPlayStyle,
    tacticalPlan: run.tacticalPlan,
    players,
    bench,
    captainId: run.captainId,
    chemistry: run.chemistry,
    isGhost: false,
    power: 0,
  };
  info.power = calculateTeamPower(info);
  return info;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'login',
  booting: true,
  run: null,

  draftTeamName: '',
  draftFormationId: '2-2-1',
  draftPlayStyle: 'dengeli',
  draftPlan: defaultPlan,
  squadSlots: [],
  benchSlots: [],
  captainId: null,
  activeSlotId: null,
  activeSlotPosition: null,
  candidates: null,
  benchPositionPending: null,

  opponent: null,
  opponentFound: false,
  session: null,
  halftimeSummary: [],
  rewards: null,
  finalScore: null,
  penaltyScore: null,
  playerWon: false,
  playerDraw: false,
  manOfTheMatch: null,
  criticalMoment: null,

  init: async () => {
    await useUserStore.getState().init();
    const user = useUserStore.getState().user;
    const run = await runService.getActiveRun();
    set({ run, booting: false, screen: user ? 'home' : 'login' });
  },

  goto: (screen) => set({ screen }),

  startNewTeamFlow: () => {
    set({
      draftTeamName: '',
      draftFormationId: '2-2-1',
      draftPlayStyle: 'dengeli',
      draftPlan: defaultPlan,
      squadSlots: [],
      benchSlots: [],
      captainId: null,
      activeSlotId: null,
      activeSlotPosition: null,
      candidates: null,
      benchPositionPending: null,
      opponent: null,
      opponentFound: false,
      session: null,
      rewards: null,
      finalScore: null,
      penaltyScore: null,
      screen: 'mode-select',
    });
  },

  setTeamName: (name) => set({ draftTeamName: name }),

  suggestTeamName: () => {
    const rng = createRng(randomSeed());
    set({ draftTeamName: rng.pick(teamNamePool) });
  },

  setFormation: (formationId) => set({ draftFormationId: formationId }),
  setPlayStyle: (style) => set({ draftPlayStyle: style }),
  setPlan: (updates) => set((s) => ({ draftPlan: { ...s.draftPlan, ...updates } })),

  confirmTactics: () => {
    const formation = getFormation(get().draftFormationId);
    set({
      squadSlots: buildSquadSlots(formation),
      benchSlots: buildBenchSlots(),
      screen: 'draft',
    });
  },

  openSlot: (slotId) => {
    const { squadSlots, benchSlots, captainId } = get();
    const squadSlot = squadSlots.find((s) => s.id === slotId);
    const benchSlot = benchSlots.find((b) => b.id === slotId);
    if (squadSlot?.playerId || benchSlot?.playerId) return; // dolu slot

    if (benchSlot && !benchSlot.position) {
      set({ benchPositionPending: slotId, activeSlotId: null, candidates: null });
      return;
    }
    const position = squadSlot?.position ?? benchSlot?.position;
    if (!position) return;

    const exclude = new Set<string>();
    for (const s of squadSlots) if (s.playerId) exclude.add(s.playerId);
    for (const b of benchSlots) if (b.playerId) exclude.add(b.playerId);
    if (captainId) exclude.add(captainId);

    const rng = createRng(randomSeed());
    const candidates = generateDraftCandidates(rng, position, exclude);
    set({ activeSlotId: slotId, activeSlotPosition: position, candidates, benchPositionPending: null });
  },

  chooseBenchPosition: (slotId, position) => {
    set((s) => ({
      benchSlots: s.benchSlots.map((b) => (b.id === slotId ? { ...b, position } : b)),
      benchPositionPending: null,
    }));
    get().openSlot(slotId);
  },

  pickCandidate: async (playerId) => {
    const { activeSlotId, squadSlots, benchSlots, captainId } = get();
    if (!activeSlotId) return;
    const newCaptainId = assignCaptainIfFirstPick(captainId, playerId);
    const newSquad = squadSlots.map((s) => (s.id === activeSlotId ? { ...s, playerId } : s));
    const newBench = benchSlots.map((b) => (b.id === activeSlotId ? { ...b, playerId } : b));
    set({
      squadSlots: newSquad,
      benchSlots: newBench,
      captainId: newCaptainId,
      activeSlotId: null,
      activeSlotPosition: null,
      candidates: null,
    });

    if (isDraftComplete(newSquad, newBench)) {
      const state = get();
      const user = useUserStore.getState().user;
      if (!user) return;
      const onField = newSquad.filter((s) => s.playerId).map((s) => getPlayer(s.playerId!));
      const chemistry = calculateTeamChemistry(onField, newCaptainId);
      const run = await runService.createNewRun({
        userId: user.id,
        mode: 'classic',
        teamName: state.draftTeamName || 'İsimsiz Takım',
        formationId: state.draftFormationId,
        defaultPlayStyle: state.draftPlayStyle,
        tacticalPlan: state.draftPlan,
        squad: newSquad,
        bench: newBench,
        captainId: newCaptainId,
        chemistry,
      });
      set({ run, screen: 'squad-review' });
    }
  },

  findMatch: async () => {
    const run = get().run;
    if (!run) return;
    set({ screen: 'matchmaking', opponent: null, opponentFound: false });
    const me = playerTeamInfo(run);
    const opponent = await matchmakingService.findOpponent(me.power, run.teamName);
    set({ opponent, opponentFound: true });
  },

  startMatch: () => {
    const { run, opponent } = get();
    if (!run || !opponent) return;
    const rng = createRng(randomSeed());
    const narration = createNarrationEngine(rng);
    const home: SimTeamState = { info: playerTeamInfo(run), goals: 0, acrobaticsUsed: 0 };
    const away: SimTeamState = { info: opponent, goals: 0, acrobaticsUsed: 0 };
    const firstHalfEvents = generateMatchEvents({ home, away, rng, narration }, 1);
    set({
      session: {
        rng,
        narration,
        home,
        away,
        firstHalfEvents,
        secondHalfEvents: null,
        extraTimeEvents: null,
        penalties: null,
        subsUsed: 0,
      },
      screen: 'match',
      rewards: null,
      finalScore: null,
      penaltyScore: null,
      halftimeSummary: [],
    });
  },

  reachHalftime: () => {
    const session = get().session;
    if (!session) return;
    const score: [number, number] = [session.home.goals, session.away.goals];
    const summary = generateHalfTimeSummary(session.firstHalfEvents, session.home.info, session.away.info, score);
    set({ halftimeSummary: summary, screen: 'half-time' });
  },

  halftimeSetPlayStyle: (style) => {
    const { session, run } = get();
    if (!session || !run) return;
    session.home.info.defaultPlayStyle = style;
    set({ run: { ...run, defaultPlayStyle: style } });
  },

  halftimeSetPlan: (updates) => {
    const { session, run } = get();
    if (!session || !run) return;
    const newPlan = { ...session.home.info.tacticalPlan, ...updates };
    session.home.info.tacticalPlan = newPlan;
    set({ run: { ...run, tacticalPlan: newPlan } });
  },

  makeSubstitution: (outId, inId) => {
    const { session } = get();
    if (!session) return 'Aktif maç yok';
    const check = validateSubstitution(session.home.info, outId, inId, session.subsUsed);
    if (!check.ok) return check.reason ?? 'Değişiklik yapılamadı';
    const { players, bench } = applySubstitution(session.home.info, outId, inId);
    session.home.info.players = players;
    session.home.info.bench = bench;
    // Kimya sahadaki 6 üzerinden yeniden hesaplanır
    session.home.info.chemistry = calculateTeamChemistry(players, session.home.info.captainId);
    session.subsUsed += 1;
    set({ session: { ...session } });
    return null;
  },

  startSecondHalf: () => {
    const session = get().session;
    if (!session) return;
    const events = generateMatchEvents(
      { home: session.home, away: session.away, rng: session.rng, narration: session.narration },
      2,
    );
    set({ session: { ...session, secondHalfEvents: events }, screen: 'match' });
  },

  // 60' sonunda eşitlik varsa uzatma oynanır — maç berabere bitmez
  afterSecondHalf: async () => {
    const session = get().session;
    if (!session) return;
    if (session.home.goals !== session.away.goals) {
      await get().finishMatch();
      return;
    }
    const events = generateExtraTimeEvents({
      home: session.home,
      away: session.away,
      rng: session.rng,
      narration: session.narration,
    });
    set({ session: { ...session, extraTimeEvents: events } });
  },

  // Uzatma da eşit biterse seri penaltılar
  afterExtraTime: async () => {
    const session = get().session;
    if (!session) return;
    if (session.home.goals !== session.away.goals) {
      await get().finishMatch();
      return;
    }
    const penalties = simulatePenaltyShootout(session.rng, session.home.info, session.away.info);
    set({ session: { ...session, penalties } });
  },

  finishMatch: async () => {
    const { session, run } = get();
    if (!session || !run || !session.secondHalfEvents) return;
    const events = [
      ...session.firstHalfEvents,
      ...session.secondHalfEvents,
      ...(session.extraTimeEvents ?? []),
    ];
    const finalScore: [number, number] = [session.home.goals, session.away.goals];
    const pens = session.penalties;
    // Beraberlik yok: eşitlik uzatma + penaltılarla mutlaka çözülür
    const won = finalScore[0] > finalScore[1] || (finalScore[0] === finalScore[1] && pens?.winner === 'home');

    const rewards = calculateRunPoints({
      won,
      draw: false,
      myGoals: finalScore[0],
      opponentGoals: finalScore[1],
      streakBeforeMatch: run.streak,
      myPower: session.home.info.power,
      opponentPower: session.away.info.power,
      opponent: session.away.info,
    });

    const updatedRun: Run = won
      ? await runService.continueRunAfterWin(run, rewards.total, rewards.newStreak)
      : await runService.eliminateRun(run);

    await useUserStore.getState().applyMatchOutcome({
      pointsGained: rewards.total,
      won,
      lost: !won,
      streak: rewards.newStreak,
      activeRunId: won ? updatedRun.id : null,
    });

    set({
      run: won ? updatedRun : null,
      rewards,
      finalScore,
      penaltyScore: pens ? [pens.homeGoals, pens.awayGoals] : null,
      playerWon: won,
      playerDraw: false,
      manOfTheMatch: pickManOfTheMatch(events, session.home.info, session.away.info),
      criticalMoment: pens ? pens.lines[pens.lines.length - 1].text : pickCriticalMoment(events),
      screen: 'match-result',
    });
  },

  afterResult: async () => {
    const { playerWon, playerDraw } = get();
    if (playerWon || playerDraw) {
      set({ screen: 'squad-review', session: null, opponent: null, opponentFound: false });
    } else {
      set({ screen: 'home', session: null, opponent: null, opponentFound: false });
    }
  },
}));

export { MAX_SUBSTITUTIONS };
