import { create } from 'zustand';
import type {
  AnyPlayer,
  BenchSlot,
  FieldPosition,
  GameMode,
  MatchEvent,
  MatchRewards,
  PenaltyShootoutResult,
  PlayStyle,
  Position,
  Run,
  ScreenId,
  SquadSlot,
  TacticalPlan,
  TeamMatchInfo,
} from '../types';
import { getFormation, getPlayer, teamNamePool } from '../data';
import { createRng, randomSeed } from '../utils/random';
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
  createMatchSim,
  performInjuryReplacement,
  performSub,
  pickCriticalMoment,
  pickManOfTheMatch,
  planPhaseMinutes,
  produceEvent,
  reassignPosition,
  simulatePenaltyShootout,
  type MatchSim,
} from '../game/matchEngine';
import type { AssistantAction } from '../game/assistantEngine';
import { generateHalfTimeSummary, validateSubstitution, MAX_SUBSTITUTIONS } from '../game/halftimeEngine';
import { calculateRunPoints } from '../game/scoringEngine';
import {
  TOURNAMENT_CHAMPION_BONUS,
  TOURNAMENT_TOTAL_ROUNDS,
  tournamentPowerBoost,
  tournamentRoundBonus,
  tournamentRoundLabel,
  tournamentStageResult,
} from '../game/tournamentEngine';
import { buildMatchReport } from '../game/matchReport';
import * as runService from '../services/runService';
import * as matchmakingService from '../services/matchmakingService';
import * as historyService from '../services/historyService';
import { useUserStore } from './useUserStore';

export type MatchPhase = 'H1' | 'H2' | 'ET' | 'PENS';

/** Maç içi taktik değişikliği üst sınırı (devre arası hariç) */
export const MAX_INMATCH_TACTIC_CHANGES = 2;

// Maç oturumu — serileştirilmez; sayfa yenilenirse maç düşer, run korunur
export interface MatchSession {
  sim: MatchSim;
  phase: MatchPhase;
  plannedMinutes: number[];
  events: MatchEvent[]; // tüm fazlar, üretim sırasıyla
  penalties: PenaltyShootoutResult | null;
  revealCursor: number; // ekranda açılmış satır sayısı (global)
  inMatchTacticChanges: number;
}

interface GameState {
  screen: ScreenId;
  booting: boolean;
  run: Run | null;

  // Draft akışı
  draftMode: GameMode;
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
  /** Draft başına tek yeniden çevirme hakkı */
  rerollUsed: boolean;

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
  /** Turnuva kupası bu maçla kazanıldı */
  playerChampion: boolean;
  manOfTheMatch: string | null;
  criticalMoment: string | null;

  // Aksiyonlar
  init: () => Promise<void>;
  goto: (screen: ScreenId) => void;
  startNewTeamFlow: () => void;
  /** Mod seçiminden draft akışına giriş (klasik / turnuva) */
  startDraftFlow: (mode: GameMode) => void;
  setTeamName: (name: string) => void;
  suggestTeamName: () => void;
  setFormation: (formationId: string) => void;
  setPlayStyle: (style: PlayStyle) => void;
  setPlan: (updates: Partial<TacticalPlan>) => void;
  confirmTactics: () => void;
  openSlot: (slotId: string) => void;
  rerollCandidates: () => void;
  pickCandidate: (playerId: string) => Promise<void>;
  /** Kadro düzenleme: ilk 6 ↔ yedek takası. Dönen değer: hata veya mevki-dışı uyarısı */
  swapWithBench: (fieldSlotId: string, benchSlotId: string) => Promise<{ error?: string; warning?: string }>;
  findMatch: () => Promise<void>;
  startMatch: () => void;

  // Maç akışı (streaming)
  advanceReveal: () => void;
  revealAllPhase: () => void;
  produceNext: () => void;
  endPhase: () => Promise<void>;
  startSecondHalf: () => void;

  // Müdahaleler
  halftimeSetPlayStyle: (style: PlayStyle) => void;
  halftimeSetPlan: (updates: Partial<TacticalPlan>) => void;
  makeSubstitution: (outId: string, inId: string) => string | null;
  sidelineTacticChange: (style: PlayStyle | null, plan: Partial<TacticalPlan> | null) => string | null;
  /** Sakat çıkan oyuncunun yerine kulübeden isim sokar (zorunlu değişiklik) */
  makeInjuryReplacement: (inId: string) => string | null;
  /** Zorunlu değişiklikten vazgeç: eksik oynamaya devam */
  dismissForcedSub: () => void;
  /** Maç içi mevki kaydırma (ör. kırmızı sonrası ortasahacıyı savunmaya çek) */
  sidelinePositionChange: (playerId: string, newPos: FieldPosition) => string | null;
  /** Yardımcı antrenör önerisini tek tıkla uygular */
  applyAssistantAction: (action: AssistantAction, context: 'HT' | 'LIVE') => string | null;

  finishMatch: () => Promise<void>;
  afterResult: () => Promise<void>;
}

const defaultPlan: TacticalPlan = { whenWinning: 'dengeli', whenDrawing: 'dengeli', whenLosing: 'ofansif' };

/** Mevkisi dışında dizilmiş oyuncu sayısı (GK slotu hariç — oraya zaten sadece GK girebilir) */
export function outOfPositionCount(squad: SquadSlot[]): number {
  let count = 0;
  for (const s of squad) {
    if (!s.playerId) continue;
    const p = getPlayer(s.playerId);
    if (s.position !== 'GK' && p.position !== s.position) count++;
  }
  return count;
}

function playerTeamInfo(run: Run): TeamMatchInfo {
  const players = run.squad.filter((s) => s.playerId).map((s) => getPlayer(s.playerId!));
  const bench = run.bench.filter((b) => b.playerId).map((b) => getPlayer(b.playerId!));
  const info: TeamMatchInfo = {
    runId: run.id,
    teamName: run.teamName,
    managerName: useUserStore.getState().user?.username,
    formationId: run.formationId,
    defaultPlayStyle: run.defaultPlayStyle,
    tacticalPlan: run.tacticalPlan,
    players,
    bench,
    captainId: run.captainId,
    chemistry: calculateTeamChemistry(players, run.captainId, outOfPositionCount(run.squad)),
    isGhost: false,
    power: 0,
  };
  info.power = calculateTeamPower(info);
  return info;
}

/** Faz → simülasyon yarısı */
function halfOf(phase: MatchPhase): 1 | 2 {
  return phase === 'H1' ? 1 : 2;
}

/** Fazın toplam satır sayısı (event satırları + penaltı satırları) */
export function totalLines(session: MatchSession): number {
  const eventLines = session.events.reduce((sum, e) => sum + e.textLines.length, 0);
  const penLines = session.penalties ? session.penalties.lines.length : 0;
  return eventLines + penLines;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'login',
  booting: true,
  run: null,

  draftMode: 'classic',
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
  rerollUsed: false,

  opponent: null,
  opponentFound: false,
  session: null,
  halftimeSummary: [],
  rewards: null,
  finalScore: null,
  penaltyScore: null,
  playerWon: false,
  playerDraw: false,
  playerChampion: false,
  manOfTheMatch: null,
  criticalMoment: null,

  init: async () => {
    await useUserStore.getState().init();
    const user = useUserStore.getState().user;
    const run = await runService.getActiveRun();
    set({ run, booting: false, screen: user ? 'home' : 'login' });
  },

  goto: (screen) => set({ screen }),

  startDraftFlow: (mode) => {
    set({ draftMode: mode, screen: 'team-name' });
  },

  startNewTeamFlow: () => {
    set({
      draftMode: 'classic',
      draftTeamName: '',
      playerChampion: false,
      draftFormationId: '2-2-1',
      draftPlayStyle: 'dengeli',
      draftPlan: defaultPlan,
      squadSlots: [],
      benchSlots: [],
      captainId: null,
      activeSlotId: null,
      activeSlotPosition: null,
      candidates: null,
      rerollUsed: false,
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
    const { squadSlots, benchSlots, captainId, candidates: openCandidates } = get();
    // Zorunlu seçim: adaylar masadayken başka slota geçilemez (reroll exploit'i kapalı)
    if (openCandidates) return;
    const squadSlot = squadSlots.find((s) => s.id === slotId);
    const benchSlot = benchSlots.find((b) => b.id === slotId);
    if (squadSlot?.playerId || benchSlot?.playerId) return;

    const position = squadSlot?.position ?? benchSlot?.position;
    if (!position) return;

    const exclude = new Set<string>();
    for (const s of squadSlots) if (s.playerId) exclude.add(s.playerId);
    for (const b of benchSlots) if (b.playerId) exclude.add(b.playerId);
    if (captainId) exclude.add(captainId);

    const rng = createRng(randomSeed());
    const candidates = generateDraftCandidates(rng, position, exclude);
    set({ activeSlotId: slotId, activeSlotPosition: position, candidates });
  },

  /** Draft başına 1 kez: masadaki üç adayı yenileriyle değiştirir */
  rerollCandidates: () => {
    const { rerollUsed, candidates, activeSlotPosition, squadSlots, benchSlots, captainId } = get();
    if (rerollUsed || !candidates || !activeSlotPosition) return;
    const exclude = new Set<string>();
    for (const s of squadSlots) if (s.playerId) exclude.add(s.playerId);
    for (const b of benchSlots) if (b.playerId) exclude.add(b.playerId);
    if (captainId) exclude.add(captainId);
    for (const c of candidates) exclude.add(c.id); // eski adaylar geri gelmez
    const rng = createRng(randomSeed());
    set({ candidates: generateDraftCandidates(rng, activeSlotPosition, exclude), rerollUsed: true });
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
        mode: state.draftMode,
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

  swapWithBench: async (fieldSlotId, benchSlotId) => {
    const { run } = get();
    if (!run) return { error: 'Aktif kadro yok' };
    const fieldSlot = run.squad.find((s) => s.id === fieldSlotId);
    const benchSlot = run.bench.find((b) => b.id === benchSlotId);
    if (!fieldSlot?.playerId || !benchSlot?.playerId) return { error: 'Slot bulunamadı' };

    const fieldPlayer = getPlayer(fieldSlot.playerId);
    const benchPlayer = getPlayer(benchSlot.playerId);

    if (fieldSlot.position === 'GK' && benchPlayer.position !== 'GK')
      return { error: 'Kaleye yalnızca kaleci geçebilir.' };
    if (fieldSlot.position !== 'GK' && benchPlayer.position === 'GK')
      return { error: 'Kaleci saha oyuncusu olarak dizilemez.' };

    const newSquad = run.squad.map((s) => (s.id === fieldSlotId ? { ...s, playerId: benchPlayer.id } : s));
    const newBench = run.bench.map((b) =>
      b.id === benchSlotId ? { ...b, playerId: fieldPlayer.id, position: fieldPlayer.position } : b,
    );
    const onField = newSquad.filter((s) => s.playerId).map((s) => getPlayer(s.playerId!));
    const oop = outOfPositionCount(newSquad);
    const chemistry = calculateTeamChemistry(onField, run.captainId, oop);
    const updated: Run = { ...run, squad: newSquad, bench: newBench, chemistry };
    await runService.saveRun(updated);
    set({ run: updated });

    const warnings: string[] = [];
    if (benchPlayer.position !== fieldSlot.position) {
      warnings.push(
        `‼ ${benchPlayer.name} mevkisi dışında (${benchPlayer.position} → ${fieldSlot.position}). Takım kimyası bundan etkilendi.`,
      );
    }
    if (fieldPlayer.id === run.captainId) {
      warnings.push(`Ⓒ Kaptan ${fieldPlayer.name} kulübede — sahada olmadığı sürece kaptan katkısı işlemez.`);
    }
    return { warning: warnings.length > 0 ? warnings.join(' ') : undefined };
  },

  findMatch: async () => {
    const run = get().run;
    if (!run) return;
    set({ screen: 'matchmaking', opponent: null, opponentFound: false });
    const me = playerTeamInfo(run);
    // Turnuvada tur ilerledikçe rakip güç bandı yükselir
    const target = me.power + (run.mode === 'tournament' ? tournamentPowerBoost(run.wins) : 0);
    const opponent = await matchmakingService.findOpponent(target, run.teamName);
    set({ opponent, opponentFound: true });
  },

  startMatch: () => {
    const { run, opponent } = get();
    if (!run || !opponent) return;
    const rng = createRng(randomSeed());
    const sim = createMatchSim(playerTeamInfo(run), opponent, rng);
    set({
      session: {
        sim,
        phase: 'H1',
        plannedMinutes: planPhaseMinutes(rng, 'H1'),
        events: [],
        penalties: null,
        revealCursor: 0,
        inMatchTacticChanges: 0,
      },
      screen: 'match',
      rewards: null,
      finalScore: null,
      penaltyScore: null,
      halftimeSummary: [],
    });
  },

  advanceReveal: () => {
    const session = get().session;
    if (!session) return;
    if (session.revealCursor < totalLines(session)) {
      set({ session: { ...session, revealCursor: session.revealCursor + 1 } });
    }
  },

  revealAllPhase: () => {
    const session = get().session;
    if (!session) return;
    // Kalan tüm dakikaları üret, ardından imleç sona alınır
    let s = session;
    while (s.plannedMinutes.length > 0) {
      const [minute, ...rest] = s.plannedMinutes;
      const evts = produceEvent(s.sim, minute, halfOf(s.phase));
      s = { ...s, plannedMinutes: rest, events: [...s.events, ...evts] };
    }
    s = { ...s, revealCursor: totalLines(s) };
    set({ session: s });
  },

  produceNext: () => {
    const session = get().session;
    if (!session || session.plannedMinutes.length === 0) return;
    const [minute, ...rest] = session.plannedMinutes;
    const evts = produceEvent(session.sim, minute, halfOf(session.phase));
    set({ session: { ...session, plannedMinutes: rest, events: [...session.events, ...evts] } });
  },

  endPhase: async () => {
    const session = get().session;
    if (!session) return;
    const { sim } = session;
    const tied = sim.home.goals === sim.away.goals;

    switch (session.phase) {
      case 'H1': {
        const h1Events = session.events.filter((e) => e.half === 1);
        const score: [number, number] = [sim.home.goals, sim.away.goals];
        const summary = generateHalfTimeSummary(h1Events, sim.home.info, sim.away.info, score);
        set({ halftimeSummary: summary, screen: 'half-time' });
        return;
      }
      case 'H2': {
        if (!tied) {
          await get().finishMatch();
          return;
        }
        set({
          session: { ...session, phase: 'ET', plannedMinutes: planPhaseMinutes(sim.rng, 'ET') },
        });
        return;
      }
      case 'ET': {
        if (!tied) {
          await get().finishMatch();
          return;
        }
        const penalties = simulatePenaltyShootout(sim.rng, sim.home.info, sim.away.info);
        set({ session: { ...session, phase: 'PENS', penalties } });
        return;
      }
      case 'PENS':
        await get().finishMatch();
    }
  },

  startSecondHalf: () => {
    const session = get().session;
    if (!session) return;
    set({
      session: { ...session, phase: 'H2', plannedMinutes: planPhaseMinutes(session.sim.rng, 'H2') },
      screen: 'match',
    });
  },

  halftimeSetPlayStyle: (style) => {
    const { session, run } = get();
    if (!session || !run) return;
    session.sim.home.info.defaultPlayStyle = style;
    set({ run: { ...run, defaultPlayStyle: style } });
  },

  halftimeSetPlan: (updates) => {
    const { session, run } = get();
    if (!session || !run) return;
    const newPlan = { ...session.sim.home.info.tacticalPlan, ...updates };
    session.sim.home.info.tacticalPlan = newPlan;
    set({ run: { ...run, tacticalPlan: newPlan } });
  },

  makeSubstitution: (outId, inId) => {
    const { session } = get();
    if (!session) return 'Aktif maç yok';
    const home = session.sim.home;
    const check = validateSubstitution(home.info, outId, inId, home.subsUsed);
    if (!check.ok) return check.reason ?? 'Değişiklik yapılamadı';
    performSub(home, outId, inId);
    set({ session: { ...session } });
    return null;
  },

  /** Maç içi "Kenara Talimat": stil/plan değişikliği (limitli) */
  sidelineTacticChange: (style, plan) => {
    const { session, run } = get();
    if (!session || !run) return 'Aktif maç yok';
    if (session.inMatchTacticChanges >= MAX_INMATCH_TACTIC_CHANGES) {
      return 'Maç içi taktik değişikliği hakkın doldu.';
    }
    if (style) session.sim.home.info.defaultPlayStyle = style;
    if (plan) {
      session.sim.home.info.tacticalPlan = { ...session.sim.home.info.tacticalPlan, ...plan };
    }
    set({
      session: { ...session, inMatchTacticChanges: session.inMatchTacticChanges + 1 },
      run: {
        ...run,
        defaultPlayStyle: session.sim.home.info.defaultPlayStyle,
        tacticalPlan: session.sim.home.info.tacticalPlan,
      },
    });
    return null;
  },

  makeInjuryReplacement: (inId) => {
    const { session } = get();
    if (!session) return 'Aktif maç yok';
    const home = session.sim.home;
    if (!home.pendingForcedSubPos) return 'Bekleyen zorunlu değişiklik yok';
    if (home.subsUsed >= MAX_SUBSTITUTIONS) return 'Değişiklik hakkı kalmadı';
    if (!performInjuryReplacement(home, inId)) return 'Bu oyuncu oyuna giremez';
    set({ session: { ...session } });
    return null;
  },

  dismissForcedSub: () => {
    const { session } = get();
    if (!session) return;
    session.sim.home.pendingForcedSubPos = null;
    set({ session: { ...session } });
  },

  sidelinePositionChange: (playerId, newPos) => {
    const { session } = get();
    if (!session) return 'Aktif maç yok';
    if (!reassignPosition(session.sim.home, playerId, newPos)) return 'Mevki değişikliği yapılamadı';
    set({ session: { ...session } });
    return null;
  },

  applyAssistantAction: (action, context) => {
    switch (action.kind) {
      case 'sub':
        if (!action.outId || !action.inId) return 'Öneri eksik';
        return get().makeSubstitution(action.outId, action.inId);
      case 'position':
        if (!action.playerId || !action.newPos) return 'Öneri eksik';
        return get().sidelinePositionChange(action.playerId, action.newPos);
      case 'plan': {
        if (!action.plan) return 'Öneri eksik';
        if (context === 'HT') {
          get().halftimeSetPlan(action.plan);
          return null;
        }
        return get().sidelineTacticChange(null, action.plan);
      }
    }
  },

  finishMatch: async () => {
    const { session, run } = get();
    if (!session || !run) return;
    const { sim, events, penalties } = session;
    const finalScore: [number, number] = [sim.home.goals, sim.away.goals];
    const won = finalScore[0] > finalScore[1] || (finalScore[0] === finalScore[1] && penalties?.winner === 'home');

    const rewards = calculateRunPoints({
      won,
      draw: false,
      myGoals: finalScore[0],
      opponentGoals: finalScore[1],
      streakBeforeMatch: run.streak,
      myPower: sim.home.info.power,
      opponentPower: sim.away.info.power,
      opponent: sim.away.info,
    });

    // Turnuva: tur atlama bonusu + şampiyonluk
    const isTournament = run.mode === 'tournament';
    const champion = isTournament && won && run.wins + 1 >= TOURNAMENT_TOTAL_ROUNDS;
    if (isTournament && won) {
      rewards.breakdown.push({ reason: `${tournamentRoundLabel(run.wins)} turu geçildi`, points: tournamentRoundBonus(run.wins) });
      rewards.total += tournamentRoundBonus(run.wins);
      if (champion) {
        rewards.breakdown.push({ reason: '🏆 Şampiyonluk', points: TOURNAMENT_CHAMPION_BONUS });
        rewards.total += TOURNAMENT_CHAMPION_BONUS;
      }
    }

    const updatedRun: Run = won
      ? champion
        ? await runService.completeRun(run, rewards.total, rewards.newStreak)
        : await runService.continueRunAfterWin(run, rewards.total, rewards.newStreak)
      : await runService.eliminateRun(run);

    await useUserStore.getState().applyMatchOutcome({
      mode: isTournament ? 'tournament' : 'classic',
      pointsGained: rewards.total,
      won,
      lost: !won,
      streak: rewards.newStreak,
      activeRunId: won && !champion ? updatedRun.id : null,
      stageReached: isTournament ? (won ? run.wins + 1 : run.wins) : undefined,
    });

    // Run kapandıysa geçmişe yaz: hangi takımla nereye kadar gidildi
    if (!won || champion) {
      let captainName: string | null = null;
      try {
        captainName = run.captainId ? getPlayer(run.captainId).name : null;
      } catch {
        captainName = null;
      }
      await historyService.addRunRecord({
        id: run.id,
        mode: run.mode,
        teamName: run.teamName,
        captainName,
        wins: updatedRun.wins,
        losses: updatedRun.losses,
        resultLabel: isTournament
          ? tournamentStageResult(run.wins, champion)
          : updatedRun.wins === 0
            ? 'İlk maçta elendi'
            : `${updatedRun.wins} galibiyetlik seri`,
        champion,
        points: updatedRun.pointsEarned,
        endedAt: Date.now(),
      });
    }

    // Kupür arşivine kaydet (Ana sayfa vitrini)
    const report = buildMatchReport({
      events,
      home: sim.home.info,
      away: sim.away.info,
      finalScore,
      penalties,
      won,
      streak: rewards.newStreak,
    });
    await historyService.addClipping({
      teamName: sim.home.info.teamName,
      opponentName: sim.away.info.teamName,
      score: finalScore,
      penaltyScore: penalties ? [penalties.homeGoals, penalties.awayGoals] : null,
      won,
      headline: report.headline,
      playedAt: Date.now(),
    });

    set({
      run: won && !champion ? updatedRun : null,
      rewards,
      finalScore,
      penaltyScore: penalties ? [penalties.homeGoals, penalties.awayGoals] : null,
      playerWon: won,
      playerDraw: false,
      playerChampion: champion,
      manOfTheMatch: pickManOfTheMatch(events, sim.home.info, sim.away.info),
      criticalMoment: penalties ? penalties.lines[penalties.lines.length - 1].text : pickCriticalMoment(events),
      screen: 'match-result',
    });
  },

  afterResult: async () => {
    const { playerWon, run } = get();
    set({
      screen: playerWon && run ? 'squad-review' : 'home',
      session: null,
      opponent: null,
      opponentFound: false,
    });
  },
}));

export { MAX_SUBSTITUTIONS };
