// Maç simülasyon motoru — tüm zarlar ve perk çözümlemeleri arka planda.
// v0.2: segment (event) bazlı üretim, duran toplar, kartlar, sakatlıklar, oto değişiklik.
import type {
  AnyPlayer,
  EventResult,
  FieldPlayer,
  Goalkeeper,
  HiddenRoll,
  MatchEvent,
  MatchEventType,
  PenaltyShootoutResult,
  TeamMatchInfo,
  WeatherModifier,
} from '../types';
import { isGoalkeeper } from '../types';
import type { Rng } from '../utils/random';
import { weightedPick } from '../utils/weightedRandom';
import { getPerk } from '../data';
import { getFormation } from '../data/formations';
import { applyChemistryModifier, calculateTeamChemistry, chemistryTempoFactor } from './chemistryEngine';
import { applyTacticModifiers, getActiveTacticByScoreState, type TacticModifiers } from './tacticsEngine';
import { createNarrationEngine, type NarrationContext, type NarrationEngine } from './narrationEngine';
import { getNeutralWeather } from './weatherEngine';
import { MAX_SUBSTITUTIONS } from './halftimeEngine';

// ---- Denge sabitleri (1000 maçlık simülasyonla kalibre edildi) ----
const GK_EDGE = 3; // kalecinin doğal avantajı
const CLEAR_CHANCE_MARGIN = 6; // net pozisyon eşiği
const GOAL_MARGIN = 2; // şutun kaleciyi geçme eşiği
const PERK_TRIGGER_CHANCE = 0.35;
const CAPTAIN_MAIN_PERK_CHANCE = 0.6;
const CAPTAIN_BONUS = 1;
// Duran top / kart / sakatlık oranları
const FOUL_ON_DEFENSE_WIN = 0.45; // savunma dueli kazanırken sert müdahale ihtimali
const FOUL_FK_CHANCE = 0.35; // faulün şutluk serbest vuruş doğurma ihtimali
const FOUL_PEN_CHANCE = 0.06; // faulün penaltı olma ihtimali
const YELLOW_CHANCE = 0.4;
const DIRECT_RED_CHANCE = 0.03; // yalnızca net gol şansı pozisyonlarında
const INJURY_ON_FOUL = 0.04;
const CORNER_FOLLOWUP = 0.35;

export interface SimTeamState {
  info: TeamMatchInfo;
  goals: number;
  acrobaticsUsed: number;
  yellowCards: Record<string, number>;
  sentOffIds: string[];
  injuredIds: string[];
  subsUsed: number;
  tacticalSubDone: boolean;
}

export function createSimTeamState(info: TeamMatchInfo): SimTeamState {
  return {
    info,
    goals: 0,
    acrobaticsUsed: 0,
    yellowCards: {},
    sentOffIds: [],
    injuredIds: [],
    subsUsed: 0,
    tacticalSubDone: false,
  };
}

export interface MatchSim {
  home: SimTeamState;
  away: SimTeamState;
  rng: Rng;
  narration: NarrationEngine;
  weather: WeatherModifier;
}

export function createMatchSim(
  home: TeamMatchInfo,
  away: TeamMatchInfo,
  rng: Rng,
  narration?: NarrationEngine,
): MatchSim {
  return {
    home: createSimTeamState(home),
    away: createSimTeamState(away),
    rng,
    narration: narration ?? createNarrationEngine(rng),
    weather: getNeutralWeather(),
  };
}

function fieldPlayersOf(team: TeamMatchInfo): FieldPlayer[] {
  return team.players.filter((p): p is FieldPlayer => !isGoalkeeper(p));
}

function goalkeeperOf(team: TeamMatchInfo): Goalkeeper | null {
  return (team.players.find(isGoalkeeper) as Goalkeeper | undefined) ?? null;
}

export function calculateTeamPower(team: Pick<TeamMatchInfo, 'players' | 'chemistry'>): number {
  const avg = team.players.reduce((s, p) => s + p.ovr, 0) / Math.max(1, team.players.length);
  return Math.round((avg + team.chemistry.score / 10) * 10) / 10;
}

/** Eksik oyuncu (kırmızı / değişiklik hakkı bitmiş sakatlık) cezası */
function missingPlayerCount(state: SimTeamState): number {
  return Math.max(0, 5 - fieldPlayersOf(state.info).length);
}

/** Oyuncuyu sahadan düşürür (kırmızı kart veya değişiklik yapılamayan sakatlık) */
function removeFromField(state: SimTeamState, playerId: string, reason: 'red' | 'injury'): void {
  state.info.players = state.info.players.filter((p) => p.id !== playerId);
  if (reason === 'red') state.sentOffIds.push(playerId);
  else state.injuredIds.push(playerId);
  state.info.chemistry = calculateTeamChemistry(state.info.players, state.info.captainId);
}

/** Değişikliği uygular (motor + UI ortak yolu) */
export function performSub(state: SimTeamState, outId: string, inId: string): boolean {
  const inPlayer = state.info.bench.find((p) => p.id === inId);
  if (!inPlayer) return false;
  state.info.players = state.info.players.map((p) => (p.id === outId ? inPlayer : p));
  state.info.bench = state.info.bench.filter((p) => p.id !== inId);
  state.subsUsed += 1;
  state.info.chemistry = calculateTeamChemistry(state.info.players, state.info.captainId);
  return true;
}

// ---- Perk çözümleme ----
interface PerkResolution {
  bonus: number;
  triggered: string[];
  hints: string[];
}

function resolveHiddenPerkInteraction(
  rng: Rng,
  player: AnyPlayer,
  isCaptain: boolean,
  eventType: MatchEventType,
  opponentTriggered: string[],
): PerkResolution {
  let bonus = 0;
  const triggered: string[] = [];
  const hints: string[] = [];
  player.perks.forEach((perkId, index) => {
    const perk = getPerk(perkId);
    if (!perk) return;
    if (!perk.triggerEvents.includes(eventType)) return;
    const chance = isCaptain && index === 0 ? CAPTAIN_MAIN_PERK_CHANCE : PERK_TRIGGER_CHANCE;
    if (!rng.chance(chance)) return;
    let value = perk.bonusValue;
    const countered = opponentTriggered.some((oppId) => {
      const opp = getPerk(oppId);
      return opp?.counters.includes(perk.id);
    });
    if (countered) value = Math.ceil(value / 2);
    bonus += value;
    triggered.push(perk.id);
    hints.push(...perk.narrationHints);
  });
  return { bonus, triggered, hints };
}

// ---- Yardımcılar ----
interface DuelContext {
  sim: MatchSim;
  attacking: SimTeamState;
  defending: SimTeamState;
  attackingSide: 'home' | 'away';
  minute: number;
  half: 1 | 2;
}

function tacticOf(ctx: DuelContext, side: 'attacking' | 'defending'): TacticModifiers {
  const me = side === 'attacking' ? ctx.attacking : ctx.defending;
  const other = side === 'attacking' ? ctx.defending : ctx.attacking;
  const style = getActiveTacticByScoreState(me.info.tacticalPlan, me.goals, other.goals);
  const oppStyle = getActiveTacticByScoreState(other.info.tacticalPlan, other.goals, me.goals);
  return applyTacticModifiers(style, oppStyle, getFormation(me.info.formationId).playStyleAffinity);
}

function pickEventType(rng: Rng, ctx: DuelContext, attackerPerkIds: string[]): MatchEventType {
  const counterBias = tacticOf(ctx, 'attacking').counterBias;
  const has = (id: string) => attackerPerkIds.includes(id);
  const acroAllowed = ctx.attacking.acrobaticsUsed < 2;
  const entries: Array<{ value: MatchEventType; weight: number }> = [
    { value: 'plase', weight: 14 },
    { value: 'karsi-karsiya', weight: 9 },
    { value: 'uzaktan-sut', weight: 11 },
    { value: 'dar-aci', weight: 7 },
    { value: 'kafa', weight: 9 },
    { value: 'korner', weight: 9 },
    { value: 'calim', weight: 10 },
    { value: 'ara-pas', weight: 11 },
    { value: 'ters-top', weight: 6 },
    { value: 'kontra', weight: 7 + counterBias * 25 },
    { value: 'blok', weight: 4 },
    { value: 'cizgiden', weight: 2 },
    { value: 'rovasata', weight: acroAllowed ? (has('rovasata-tehdidi') ? 3 : 0.5) : 0 },
    { value: 'rabona', weight: acroAllowed ? (has('rabona-imzasi') ? 2.5 : 0.4) : 0 },
  ];
  if (ctx.minute >= 55) entries.push({ value: 'son-dakika', weight: 12 });
  return weightedPick(rng, entries.filter((e) => e.weight > 0));
}

function selectInvolvedPlayers(rng: Rng, ctx: DuelContext, eventType: MatchEventType) {
  const attackers = fieldPlayersOf(ctx.attacking.info);
  const defenders = fieldPlayersOf(ctx.defending.info);

  const attackerPool = attackers.map((p) => ({
    value: p,
    weight: p.position === 'ATK' ? 5 : p.position === 'MID' ? (eventType === 'uzaktan-sut' ? 4 : 2) : 0.5,
  }));
  const attacker = weightedPick(rng, attackerPool);

  const helperPool = attackers
    .filter((p) => p.id !== attacker.id)
    .map((p) => ({ value: p, weight: p.position === 'MID' ? 5 : p.position === 'ATK' ? 2 : 1 }));
  const helper = helperPool.length > 0 ? weightedPick(rng, helperPool) : attacker;

  const defenderPool = defenders.map((p) => ({
    value: p,
    weight: p.position === 'DEF' ? 5 : p.position === 'MID' ? 2 : 0.5,
  }));
  const defender = defenderPool.length > 0 ? weightedPick(rng, defenderPool) : null;

  const gk = goalkeeperOf(ctx.defending.info);
  return { attacker, helper, defender, gk };
}

function gkStatFor(eventType: MatchEventType, gk: Goalkeeper): number {
  if (eventType === 'kafa' || eventType === 'korner' || eventType === 'rovasata') return gk.command;
  return gk.ref;
}

function narrationCtx(
  ctx: DuelContext,
  players: { attacker?: AnyPlayer | null; helper?: AnyPlayer | null; defender?: AnyPlayer | null; gk?: Goalkeeper | null },
  hints: string[],
  score: [number, number],
  goalState?: 'ahead' | 'tie' | 'behind',
): NarrationContext {
  return {
    minute: ctx.minute,
    attacker: players.attacker?.name ?? '',
    helper: players.helper?.name ?? '',
    defender: players.defender?.name ?? '',
    gk: players.gk?.name ?? 'kaleci',
    team: ctx.attacking.info.teamName,
    opponent: ctx.defending.info.teamName,
    score: `${score[0]} - ${score[1]}`,
    perkHints: hints,
    goalState,
  };
}

function scoreNow(ctx: DuelContext): [number, number] {
  const homeGoals = ctx.attackingSide === 'home' ? ctx.attacking.goals : ctx.defending.goals;
  const awayGoals = ctx.attackingSide === 'home' ? ctx.defending.goals : ctx.attacking.goals;
  return [homeGoals, awayGoals];
}

function goalStateOf(ctx: DuelContext): 'ahead' | 'tie' | 'behind' {
  if (ctx.attacking.goals > ctx.defending.goals) return 'ahead';
  if (ctx.attacking.goals === ctx.defending.goals) return 'tie';
  return 'behind';
}

function baseEvent(
  ctx: DuelContext,
  type: MatchEventType,
  result: EventResult,
  involved: string[],
  textLines: string[],
  extra?: Partial<MatchEvent>,
): MatchEvent {
  return {
    minute: ctx.minute,
    half: ctx.half,
    type,
    attackingTeam: ctx.attackingSide,
    defendingTeam: ctx.attackingSide === 'home' ? 'away' : 'home',
    playersInvolved: involved,
    hiddenPerksTriggered: [],
    hiddenDiceRolls: [],
    textLines,
    result,
    scoreAfterEvent: scoreNow(ctx),
    ...extra,
  };
}

// ---- Duran toplar ----
function buildFreeKickEvent(ctx: DuelContext): MatchEvent {
  const { rng, narration } = ctx.sim;
  const attackers = fieldPlayersOf(ctx.attacking.info);
  // Duran top sorumlusu: ATK+MID karışımı; 'Ölü Köşe' sahibi öncelikli
  const taker = [...attackers].sort(
    (a, b) =>
      b.atk * 0.5 + b.mid * 0.5 + (b.perks.includes('olu-kose') ? 15 : 0) -
      (a.atk * 0.5 + a.mid * 0.5 + (a.perks.includes('olu-kose') ? 15 : 0)),
  )[0];
  const gk = goalkeeperOf(ctx.defending.info);
  const defenders = fieldPlayersOf(ctx.defending.info);
  const wallBest = defenders.length > 0 ? Math.max(...defenders.map((d) => d.def)) : 50;

  const rolls: HiddenRoll[] = [];
  const perkRes = resolveHiddenPerkInteraction(rng, taker, taker.id === ctx.attacking.info.captainId, 'serbest-vurus', []);
  const atkChem = applyChemistryModifier(ctx.attacking.info.chemistry.tier);
  const fkRoll = rng.d20();
  rolls.push({ label: 'serbest vuruş', value: fkRoll });
  const fkTotalGoals = ctx.attacking.goals + ctx.defending.goals;
  const fkRunaway = Math.max(0, ctx.attacking.goals - 1) * 3 + Math.max(0, fkTotalGoals - 3) * 3;
  const fkScore = taker.atk * 0.5 + taker.mid * 0.5 + perkRes.bonus + atkChem - fkRunaway + fkRoll;

  let result: EventResult;
  const wallRoll = rng.d20();
  rolls.push({ label: 'baraj', value: wallRoll });
  if (fkScore < wallBest * 0.62 + wallRoll) {
    result = 'blocked';
  } else if (gk) {
    const gkRoll = rng.d20();
    rolls.push({ label: 'kaleci', value: gkRoll });
    const gkScore = gk.ref + GK_EDGE + 7 + gkRoll;
    const margin = fkScore - gkScore;
    result = margin > GOAL_MARGIN ? 'goal' : margin > -4 ? 'save' : rng.chance(0.5) ? 'miss' : 'save';
  } else {
    result = 'goal';
  }
  if (result === 'goal') ctx.attacking.goals += 1;

  const nctx = narrationCtx(ctx, { attacker: taker, gk }, perkRes.hints, scoreNow(ctx), result === 'goal' ? goalStateOf(ctx) : undefined);
  const event = baseEvent(ctx, 'serbest-vurus', result, [taker.id, ...(gk ? [gk.id] : [])], narration.freeKickLines(nctx, result), {
    setPiece: 'fk',
  });
  event.hiddenDiceRolls = rolls;
  event.hiddenPerksTriggered = perkRes.triggered;
  return event;
}

function buildPenaltyEvent(ctx: DuelContext, fouledPlayer: FieldPlayer): MatchEvent {
  const { rng, narration } = ctx.sim;
  const attackers = fieldPlayersOf(ctx.attacking.info);
  const shooter = [...attackers].sort((a, b) => b.atk - a.atk)[0];
  const gk = goalkeeperOf(ctx.defending.info);

  const rolls: HiddenRoll[] = [];
  const shotRoll = rng.d20();
  const gkRoll = rng.d20();
  rolls.push({ label: 'penaltı', value: shotRoll }, { label: 'kaleci', value: gkRoll });
  const scored = shooter.atk + shotRoll >= (gk ? gk.ref : 60) + gkRoll - 5;
  const result: EventResult = scored ? 'goal' : rng.chance(0.65) ? 'save' : 'miss';
  if (result === 'goal') ctx.attacking.goals += 1;

  const nctx = narrationCtx(
    ctx,
    { attacker: shooter, helper: fouledPlayer, gk },
    [],
    scoreNow(ctx),
    result === 'goal' ? goalStateOf(ctx) : undefined,
  );
  const event = baseEvent(ctx, 'penalti', result, [shooter.id, ...(gk ? [gk.id] : [])], narration.penaltyLines(nctx, result), {
    setPiece: 'pen',
  });
  event.hiddenDiceRolls = rolls;
  return event;
}

function buildInjuryEvents(ctx: DuelContext, injured: FieldPlayer): MatchEvent[] {
  const { narration } = ctx.sim;
  const state = ctx.attacking;
  const events: MatchEvent[] = [];
  const nctx = narrationCtx(ctx, { attacker: injured }, [], scoreNow(ctx));
  events.push(
    baseEvent(ctx, 'sakatlik', 'injury', [injured.id], narration.injuryLines(nctx), { injuryPlayerId: injured.id }),
  );

  // Zorunlu değişiklik: aynı pozisyondaki en güçlü yedek
  const candidates = state.info.bench
    .filter((b) => !isGoalkeeper(b) && (b as FieldPlayer).position === injured.position)
    .sort((a, b) => b.ovr - a.ovr);
  if (candidates.length > 0 && state.subsUsed < MAX_SUBSTITUTIONS) {
    const inPlayer = candidates[0];
    removeFromField(state, injured.id, 'injury');
    // performSub players listesinde outId arar; sakat çıktı, doğrudan ekle
    state.info.players = [...state.info.players, inPlayer];
    state.info.bench = state.info.bench.filter((p) => p.id !== inPlayer.id);
    state.subsUsed += 1;
    state.info.chemistry = calculateTeamChemistry(state.info.players, state.info.captainId);
    const subCtx = narrationCtx(ctx, { attacker: inPlayer, helper: injured }, [], scoreNow(ctx));
    events.push(
      baseEvent(ctx, 'degisiklik', 'substitution', [inPlayer.id, injured.id], narration.subLines(subCtx), {
        subOutId: injured.id,
        subInId: inPlayer.id,
      }),
    );
  } else {
    removeFromField(state, injured.id, 'injury');
  }
  return events;
}

/** Ghost rakibin taktiksel oto değişikliği (45'+ ve geride/önde) */
function maybeGhostAutoSub(sim: MatchSim, side: 'home' | 'away', minute: number, half: 1 | 2): MatchEvent | null {
  const state = side === 'home' ? sim.home : sim.away;
  const other = side === 'home' ? sim.away : sim.home;
  if (!state.info.isGhost || state.tacticalSubDone || minute < 45) return null;
  if (state.subsUsed >= MAX_SUBSTITUTIONS) return null;
  const diff = state.goals - other.goals;
  if (diff === 0) return null;
  // Geride: hücum hattını tazele · Önde: yıpranan hücumcuyu koru
  const field = fieldPlayersOf(state.info);
  const targetPos = diff < 0 ? 'ATK' : 'DEF';
  const candidatesOut = field.filter((p) => p.position === targetPos).sort((a, b) => a.ovr - b.ovr);
  const out = candidatesOut[0];
  if (!out) return null;
  const inns = state.info.bench
    .filter((b) => !isGoalkeeper(b) && (b as FieldPlayer).position === out.position && b.ovr >= out.ovr - 4)
    .sort((a, b) => b.ovr - a.ovr);
  const inn = inns[0];
  if (!inn) return null;
  performSub(state, out.id, inn.id);
  state.tacticalSubDone = true;

  const nctx: NarrationContext = {
    minute,
    attacker: inn.name,
    helper: out.name,
    defender: '',
    gk: '',
    team: state.info.teamName,
    opponent: other.info.teamName,
    score: `${sim.home.goals} - ${sim.away.goals}`,
    perkHints: [],
  };
  return {
    minute,
    half,
    type: 'degisiklik',
    attackingTeam: side,
    defendingTeam: side === 'home' ? 'away' : 'home',
    playersInvolved: [inn.id, out.id],
    hiddenPerksTriggered: [],
    hiddenDiceRolls: [],
    textLines: sim.narration.subLines(nctx),
    result: 'substitution',
    scoreAfterEvent: [sim.home.goals, sim.away.goals],
    subOutId: out.id,
    subInId: inn.id,
  };
}

// ---- Ana duel çözümü ----
function resolveDuelChain(ctx: DuelContext): MatchEvent[] {
  const { rng, narration, weather } = ctx.sim;
  const events: MatchEvent[] = [];
  const attackerPerkIdsAll = fieldPlayersOf(ctx.attacking.info).flatMap((p) => p.perks);
  const eventType = pickEventType(rng, ctx, attackerPerkIdsAll);
  const { attacker, helper, defender, gk } = selectInvolvedPlayers(rng, ctx, eventType);

  const rolls: HiddenRoll[] = [];
  const allTriggered: string[] = [];
  const hints: string[] = [];

  const atkTactic = tacticOf(ctx, 'attacking');
  const defTactic = tacticOf(ctx, 'defending');
  const atkChem = applyChemistryModifier(ctx.attacking.info.chemistry.tier);
  const defChem = applyChemistryModifier(ctx.defending.info.chemistry.tier);
  const atkMissing = missingPlayerCount(ctx.attacking);
  const defMissing = missingPlayerCount(ctx.defending);

  const isAtkCaptain = attacker.id === ctx.attacking.info.captainId;
  const isHelperCaptain = helper.id === ctx.attacking.info.captainId;
  const isDefCaptain = defender?.id === ctx.defending.info.captainId;

  const helperPerks = resolveHiddenPerkInteraction(rng, helper, isHelperCaptain, eventType, []);
  const attackerPerks = resolveHiddenPerkInteraction(rng, attacker, isAtkCaptain, eventType, []);
  const defenderPerks = defender
    ? resolveHiddenPerkInteraction(rng, defender, Boolean(isDefCaptain), eventType, [
        ...attackerPerks.triggered,
        ...helperPerks.triggered,
      ])
    : { bonus: 0, triggered: [], hints: [] };
  allTriggered.push(...attackerPerks.triggered, ...helperPerks.triggered, ...defenderPerks.triggered);

  const usesMid = eventType === 'ara-pas' || eventType === 'ters-top' || eventType === 'calim';
  const atkStat = usesMid ? Math.max(attacker.mid, helper.mid) : attacker.atk;

  const atkRoll = rng.d20();
  const defRoll = rng.d20();
  rolls.push({ label: 'atak', value: atkRoll }, { label: 'savunma', value: defRoll });

  const attackScore =
    atkStat +
    attackerPerks.bonus +
    helperPerks.bonus * 0.5 +
    (isAtkCaptain || isHelperCaptain ? CAPTAIN_BONUS : 0) +
    atkTactic.attack +
    atkChem +
    weather.shotControl -
    atkMissing +
    atkRoll;

  const defenseScore =
    (defender?.def ?? 45) +
    defenderPerks.bonus +
    (isDefCaptain ? CAPTAIN_BONUS : 0) +
    defTactic.defense +
    defChem -
    defMissing * 2 +
    defRoll;

  const margin = attackScore - defenseScore;
  let result: EventResult;

  if (margin <= 0 && defender) {
    // Savunma kazandı — sert müdahale kontrolü (faul → kart / duran top / sakatlık zinciri)
    if (rng.chance(FOUL_ON_DEFENSE_WIN)) {
      // Kart kararı
      let card: 'yellow' | 'red' | null = null;
      let secondYellow = false;
      const clearChanceFoul = eventType === 'karsi-karsiya' || eventType === 'kontra';
      if (clearChanceFoul && rng.chance(DIRECT_RED_CHANCE)) {
        card = 'red';
      } else if (rng.chance(YELLOW_CHANCE)) {
        const prev = ctx.defending.yellowCards[defender.id] ?? 0;
        if (prev >= 1) {
          // Hakem sarısı olan oyuncuya ikinci kartı daha zor çıkarır
          if (rng.chance(0.45)) {
            card = 'red';
            secondYellow = true;
          }
        } else {
          card = 'yellow';
          ctx.defending.yellowCards[defender.id] = prev + 1;
        }
      }

      const foulCtx = narrationCtx(ctx, { attacker, helper, defender, gk }, [], scoreNow(ctx));
      const foulEvent = baseEvent(
        ctx,
        'faul',
        'foul',
        [attacker.id, defender.id],
        narration.foulLines(foulCtx, card, secondYellow),
        card ? { card, cardPlayerId: defender.id } : undefined,
      );
      foulEvent.hiddenDiceRolls = rolls;
      events.push(foulEvent);

      if (card === 'red') {
        removeFromField(ctx.defending, defender.id, 'red');
      }

      // Duran top devamı
      const zoneRoll = rng.next();
      if (zoneRoll < FOUL_PEN_CHANCE) {
        events.push(buildPenaltyEvent(ctx, attacker));
      } else if (zoneRoll < FOUL_PEN_CHANCE + FOUL_FK_CHANCE) {
        events.push(buildFreeKickEvent(ctx));
      }

      // Sakatlık kontrolü (faullenen oyuncu)
      if (rng.chance(INJURY_ON_FOUL)) {
        events.push(...buildInjuryEvents(ctx, attacker));
      }
      return events;
    }

    const r = rng.next();
    if (defenderPerks.triggered.length > 0 && r < 0.5) result = 'blocked';
    else if (r < 0.25) result = 'blocked';
    else if (r < 0.4) result = 'corner-won';
    else result = 'defended';
    hints.push(...defenderPerks.hints);
  } else {
    // Şut vs kaleci
    if (!gk) {
      result = 'goal';
    } else {
      const isGkCaptain = gk.id === ctx.defending.info.captainId;
      const gkPerks = resolveHiddenPerkInteraction(rng, gk, isGkCaptain, eventType, [
        ...attackerPerks.triggered,
        ...helperPerks.triggered,
      ]);
      allTriggered.push(...gkPerks.triggered);

      const shotRoll = rng.d20();
      const gkRoll = rng.d20();
      rolls.push({ label: 'şut', value: shotRoll }, { label: 'kaleci', value: gkRoll });

      const clearChance = margin >= CLEAR_CHANCE_MARGIN;
      const totalGoals = ctx.attacking.goals + ctx.defending.goals;
      const runawayPenalty =
        Math.max(0, ctx.attacking.goals - 1) * 3 + Math.max(0, totalGoals - 3) * 3 + Math.max(0, totalGoals - 4) * 4;
      const shotScore =
        attacker.atk +
        attackerPerks.bonus +
        (isAtkCaptain ? CAPTAIN_BONUS : 0) +
        atkTactic.attack +
        atkChem +
        (clearChance ? 3 : 0) -
        defTactic.opponentShotPenalty -
        runawayPenalty +
        shotRoll;

      const gkScore =
        gkStatFor(eventType, gk) +
        gkPerks.bonus +
        (isGkCaptain ? CAPTAIN_BONUS : 0) +
        defTactic.goalkeeper +
        defChem +
        GK_EDGE +
        gkRoll;

      const shotMargin = shotScore - gkScore;
      if (shotMargin > GOAL_MARGIN) {
        result = 'goal';
      } else if (shotMargin > -4) {
        result = 'save';
        hints.push(...gkPerks.hints);
      } else {
        result = rng.chance(0.55) ? 'miss' : 'save';
        if (result === 'save') hints.push(...gkPerks.hints);
      }
    }
  }

  if (result === 'goal') ctx.attacking.goals += 1;
  if (eventType === 'rovasata' || eventType === 'rabona') ctx.attacking.acrobaticsUsed += 1;
  if (result === 'goal' || result === 'save' || result === 'miss') {
    hints.push(...attackerPerks.hints, ...helperPerks.hints);
  }

  const score = scoreNow(ctx);
  const goalState = result === 'goal' ? goalStateOf(ctx) : undefined;
  const nctx = narrationCtx(ctx, { attacker, helper, defender, gk }, hints, score, goalState);
  const event = baseEvent(
    ctx,
    eventType,
    result,
    [attacker.id, helper.id, ...(defender ? [defender.id] : []), ...(gk ? [gk.id] : [])],
    narration.eventLines(eventType, result, nctx),
  );
  event.hiddenPerksTriggered = allTriggered;
  event.hiddenDiceRolls = rolls;
  events.push(event);

  // Korner kazanıldıysa takip pozisyonu şansı
  if (result === 'corner-won' && rng.chance(CORNER_FOLLOWUP)) {
    const followCtx: DuelContext = { ...ctx };
    const follow = resolveCornerFollowUp(followCtx);
    if (follow) events.push(follow);
  }

  return events;
}

/** Korner sonrası takip pozisyonu: kafa/karambol şansı */
function resolveCornerFollowUp(ctx: DuelContext): MatchEvent | null {
  const { rng, narration } = ctx.sim;
  const attackers = fieldPlayersOf(ctx.attacking.info);
  if (attackers.length === 0) return null;
  const attacker = weightedPick(
    rng,
    attackers.map((p) => ({ value: p, weight: p.perks.includes('hava-fisegi') ? 6 : p.position === 'ATK' ? 4 : 2 })),
  );
  const helper = attackers.find((p) => p.id !== attacker.id) ?? attacker;
  const gk = goalkeeperOf(ctx.defending.info);
  const defenders = fieldPlayersOf(ctx.defending.info);
  const defender = defenders.length > 0 ? rng.pick(defenders) : null;

  const perkRes = resolveHiddenPerkInteraction(rng, attacker, attacker.id === ctx.attacking.info.captainId, 'korner', []);
  const atkRoll = rng.d20();
  const gkRoll = rng.d20();
  const attackScore = attacker.atk + perkRes.bonus + atkRoll;
  const gkScore = (gk ? gk.command : 55) + GK_EDGE + 2 + gkRoll;
  const totalGoals = ctx.attacking.goals + ctx.defending.goals;
  const runaway = Math.max(0, ctx.attacking.goals - 1) * 3 + Math.max(0, totalGoals - 3) * 3;
  const margin = attackScore - runaway - gkScore;
  const result: EventResult = margin > GOAL_MARGIN ? 'goal' : margin > -4 ? 'save' : 'miss';
  if (result === 'goal') ctx.attacking.goals += 1;

  const nctx = narrationCtx(
    ctx,
    { attacker, helper, defender, gk },
    perkRes.hints,
    scoreNow(ctx),
    result === 'goal' ? goalStateOf(ctx) : undefined,
  );
  const event = baseEvent(
    ctx,
    'korner',
    result,
    [attacker.id, helper.id, ...(gk ? [gk.id] : [])],
    narration.eventLines('korner', result, nctx),
  );
  event.hiddenPerksTriggered = perkRes.triggered;
  event.hiddenDiceRolls = [
    { label: 'korner', value: atkRoll },
    { label: 'kaleci', value: gkRoll },
  ];
  return event;
}

// ---- Faz planlama ve event üretimi ----
export type SimPhase = 'H1' | 'H2' | 'ET';

export function planPhaseMinutes(rng: Rng, phase: SimPhase): number[] {
  const [min, max, countMin, countMax] =
    phase === 'H1' ? [2, 29, 4, 6] : phase === 'H2' ? [32, 59, 4, 6] : [62, 70, 1, 2];
  const count = rng.int(countMin, countMax);
  const minutes = new Set<number>();
  let guard = 0;
  while (minutes.size < count && guard < 200) {
    minutes.add(rng.int(min, max));
    guard++;
  }
  return [...minutes].sort((a, b) => a - b);
}

function midStrength(team: TeamMatchInfo): number {
  const mids = fieldPlayersOf(team).filter((p) => p.position === 'MID');
  return mids.length > 0 ? mids.reduce((s, p) => s + p.mid, 0) / mids.length : 50;
}

/**
 * Tek "önemli an" üretir (zincirleriyle: faul→duran top→sakatlık→değişiklik).
 * Her çağrı, o anki kadro/taktik/kart durumunu okur — maç içi müdahaleler anında etki eder.
 */
export function produceEvent(sim: MatchSim, minute: number, half: 1 | 2): MatchEvent[] {
  const { rng } = sim;
  const events: MatchEvent[] = [];

  // Ghost taktiksel oto değişiklik penceresi
  for (const side of ['home', 'away'] as const) {
    const sub = maybeGhostAutoSub(sim, side, minute, half);
    if (sub) events.push(sub);
  }

  // Pozisyon sahipliği
  const homeStyle = getActiveTacticByScoreState(sim.home.info.tacticalPlan, sim.home.goals, sim.away.goals);
  const awayStyle = getActiveTacticByScoreState(sim.away.info.tacticalPlan, sim.away.goals, sim.home.goals);
  const homeMods = applyTacticModifiers(homeStyle, awayStyle, getFormation(sim.home.info.formationId).playStyleAffinity);
  const awayMods = applyTacticModifiers(awayStyle, homeStyle, getFormation(sim.away.info.formationId).playStyleAffinity);

  const homeFieldRatio = fieldPlayersOf(sim.home.info).length / 5;
  const awayFieldRatio = fieldPlayersOf(sim.away.info).length / 5;
  const homeWeight =
    midStrength(sim.home.info) * homeMods.tempo * chemistryTempoFactor(sim.home.info.chemistry.tier) * homeFieldRatio;
  const awayWeight =
    midStrength(sim.away.info) * awayMods.tempo * chemistryTempoFactor(sim.away.info.chemistry.tier) * awayFieldRatio;
  const homeAttacks = rng.next() < homeWeight / (homeWeight + awayWeight);

  const ctx: DuelContext = {
    sim,
    attacking: homeAttacks ? sim.home : sim.away,
    defending: homeAttacks ? sim.away : sim.home,
    attackingSide: homeAttacks ? 'home' : 'away',
    minute,
    half,
  };
  events.push(...resolveDuelChain(ctx));
  return events;
}

// ---- Toplu üretim (denge scripti ve uyumluluk için) ----
export interface HalfContext {
  home: SimTeamState;
  away: SimTeamState;
  rng: Rng;
  narration: NarrationEngine;
  weather?: WeatherModifier;
}

export function generateMatchEvents(ctx: HalfContext, half: 1 | 2): MatchEvent[] {
  const sim: MatchSim = {
    home: ctx.home,
    away: ctx.away,
    rng: ctx.rng,
    narration: ctx.narration,
    weather: ctx.weather ?? getNeutralWeather(),
  };
  const events: MatchEvent[] = [];
  for (const minute of planPhaseMinutes(ctx.rng, half === 1 ? 'H1' : 'H2')) {
    events.push(...produceEvent(sim, minute, half));
  }
  return events;
}

export function generateExtraTimeEvents(ctx: HalfContext): MatchEvent[] {
  const sim: MatchSim = {
    home: ctx.home,
    away: ctx.away,
    rng: ctx.rng,
    narration: ctx.narration,
    weather: ctx.weather ?? getNeutralWeather(),
  };
  const events: MatchEvent[] = [];
  for (const minute of planPhaseMinutes(ctx.rng, 'ET')) {
    events.push(...produceEvent(sim, minute, 2));
  }
  return events;
}

// ---- Seri penaltılar ----
const penSuspense = ['Koşuya geçti…', 'Stadyumda çıt yok…', 'Derin bir nefes aldı…', 'Kaleciyle göz göze…', 'Topu yerleştirdi, geri çekildi…'];
const penGoal = ['GOOOL! Köşeye çakıldı! ({score})', 'GOOOL! Kaleci ters köşede kaldı! ({score})', 'GOOOL! Üst köşeye, nokta atışı! ({score})', 'GOOOL! Soğukkanlı bir vuruş! ({score})'];
const penSave = ['{gk} KURTARDI! Köşeye uzanıp topu çeldi! ({score})', '{gk} KURTARDI! Hamlesini doğru köşeye yaptı! ({score})', '{gk} KURTARDI! Ayaklarıyla kapattı! ({score})'];
const penMiss = ['Direkten döndü! İnanılmaz! ({score})', 'Auta gitti! Topu kalenin üstünden aşırdı! ({score})'];

export function simulatePenaltyShootout(rng: Rng, home: TeamMatchInfo, away: TeamMatchInfo): PenaltyShootoutResult {
  const lines: PenaltyShootoutResult['lines'] = [];
  const shootersOf = (t: TeamMatchInfo) => [...fieldPlayersOf(t)].sort((a, b) => b.atk - a.atk);
  const homeShooters = shootersOf(home);
  const awayShooters = shootersOf(away);
  const homeGk = goalkeeperOf(away);
  const awayGk = goalkeeperOf(home);

  let hg = 0;
  let ag = 0;
  const usedTexts = new Set<string>();
  const fresh = (bank: string[]) => {
    const pool = bank.filter((b) => !usedTexts.has(b));
    const pick = rng.pick(pool.length > 0 ? pool : bank);
    usedTexts.add(pick);
    return pick;
  };

  const takeKick = (side: 'home' | 'away', round: number) => {
    const team = side === 'home' ? home : away;
    const shooters = side === 'home' ? homeShooters : awayShooters;
    const gk = side === 'home' ? homeGk : awayGk;
    const shooter = shooters[(round - 1) % shooters.length];
    const roll = rng.d20();
    const gkRoll = rng.d20();
    const scored = shooter.atk + roll >= (gk ? gk.ref : 60) + gkRoll - 5;
    if (scored) {
      if (side === 'home') hg++;
      else ag++;
    }
    const score = `${hg} - ${ag}`;
    lines.push({ text: `${round}. penaltı — ${team.teamName}: ${shooter.name} topun başında.`, emphasis: 'normal' });
    lines.push({ text: fresh(penSuspense), emphasis: 'suspense' });
    if (scored) {
      lines.push({ text: fresh(penGoal).replace('{score}', score), emphasis: 'goal' });
    } else {
      const bank = rng.chance(0.65) ? penSave : penMiss;
      lines.push({ text: fresh(bank).replace('{gk}', gk?.name ?? 'Kaleci').replace('{score}', score), emphasis: 'save' });
    }
  };

  for (let round = 1; round <= 5; round++) {
    takeKick('home', round);
    if (hg - ag > 5 - round) break;
    takeKick('away', round);
    if (Math.abs(hg - ag) > 5 - round) break;
  }
  let round = 6;
  while (hg === ag && round <= 20) {
    takeKick('home', round);
    takeKick('away', round);
    round++;
  }
  if (hg === ag) {
    if (rng.chance(0.5)) hg++;
    else ag++;
    lines.push({ text: `Ve nihayet fark yaratıldı! (${hg} - ${ag})`, emphasis: 'goal' });
  }

  const winner = hg > ag ? 'home' : 'away';
  const winnerName = winner === 'home' ? home.teamName : away.teamName;
  lines.push({ text: `Seri penaltıların sonunda kazanan: ${winnerName}! (${hg} - ${ag})`, emphasis: 'goal' });
  return { homeGoals: hg, awayGoals: ag, winner, lines };
}

// ---- Maç sonu değerlendirmeleri ----
export function pickManOfTheMatch(events: MatchEvent[], home: TeamMatchInfo, away: TeamMatchInfo): string | null {
  const impact = new Map<string, number>();
  const add = (id: string, points: number) => impact.set(id, (impact.get(id) ?? 0) + points);
  for (const e of events) {
    const [first, second, third, fourth] = e.playersInvolved;
    if (e.result === 'goal') {
      add(first, 5);
      if (second) add(second, 2);
    } else if (e.result === 'save') {
      const gkId = e.playersInvolved[e.playersInvolved.length - 1];
      if (gkId) add(gkId, 3);
    } else if (e.result === 'blocked' || e.result === 'defended') {
      if (third) add(third, 2);
    }
  }
  let best: string | null = null;
  let bestScore = 0;
  for (const [id, score] of impact) {
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  if (!best) return null;
  const all = [...home.players, ...home.bench, ...away.players, ...away.bench];
  return all.find((p) => p.id === best)?.name ?? null;
}

export function pickCriticalMoment(events: MatchEvent[]): string | null {
  const goals = events.filter((e) => e.result === 'goal');
  const lastGoal = goals[goals.length - 1];
  if (lastGoal) return lastGoal.textLines[lastGoal.textLines.length - 1];
  const bigSave = events.find((e) => e.result === 'save' && e.minute >= 50);
  if (bigSave) return bigSave.textLines[bigSave.textLines.length - 1];
  return events.length > 0 ? events[events.length - 1].textLines[0] : null;
}

export { createNarrationEngine };
