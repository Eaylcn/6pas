// Maç simülasyon motoru — tüm zarlar ve perk çözümlemeleri arka planda.
import type {
  AnyPlayer,
  EventResult,
  FieldPlayer,
  HiddenRoll,
  MatchEvent,
  MatchEventType,
  TeamMatchInfo,
  WeatherModifier,
} from '../types';
import { isGoalkeeper } from '../types';
import type { Rng } from '../utils/random';
import { weightedPick } from '../utils/weightedRandom';
import { getPerk } from '../data';
import { getFormation } from '../data/formations';
import { applyChemistryModifier, chemistryTempoFactor } from './chemistryEngine';
import { applyTacticModifiers, getActiveTacticByScoreState, type TacticModifiers } from './tacticsEngine';
import { createNarrationEngine, type NarrationEngine } from './narrationEngine';
import { getNeutralWeather } from './weatherEngine';

// ---- Denge sabitleri (1000 maçlık simülasyonla kalibre edildi) ----
const GK_EDGE = 3; // kalecinin doğal avantajı
const CLEAR_CHANCE_MARGIN = 6; // net pozisyon eşiği
const GOAL_MARGIN = 2; // şutun kaleciyi geçme eşiği
const PERK_TRIGGER_CHANCE = 0.35;
const CAPTAIN_MAIN_PERK_CHANCE = 0.6;
const CAPTAIN_BONUS = 1;

export interface SimTeamState {
  info: TeamMatchInfo;
  goals: number;
  acrobaticsUsed: number;
}

interface DuelContext {
  rng: Rng;
  narration: NarrationEngine;
  weather: WeatherModifier;
  attacking: SimTeamState;
  defending: SimTeamState;
  attackingSide: 'home' | 'away';
  minute: number;
  half: 1 | 2;
}

function fieldPlayersOf(team: TeamMatchInfo): FieldPlayer[] {
  return team.players.filter((p): p is FieldPlayer => !isGoalkeeper(p));
}

function goalkeeperOf(team: TeamMatchInfo) {
  return team.players.find(isGoalkeeper) ?? null;
}

export function calculateTeamPower(team: Pick<TeamMatchInfo, 'players' | 'chemistry'>): number {
  const avg = team.players.reduce((s, p) => s + p.ovr, 0) / Math.max(1, team.players.length);
  return Math.round((avg + team.chemistry.score / 10) * 10) / 10;
}

// ---- Perk çözümleme ----
interface PerkResolution {
  bonus: number;
  triggered: string[]; // perk id'leri
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
    // Rakipte bu perki nötralize eden tetiklenmiş perk varsa etki yarıya iner
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

// ---- Event tipi seçimi ----
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

function tacticOf(ctx: DuelContext, side: 'attacking' | 'defending'): TacticModifiers {
  const me = side === 'attacking' ? ctx.attacking : ctx.defending;
  const other = side === 'attacking' ? ctx.defending : ctx.attacking;
  const myGoals = me.goals;
  const otherGoals = other.goals;
  const style = getActiveTacticByScoreState(me.info.tacticalPlan, myGoals, otherGoals);
  const oppStyle = getActiveTacticByScoreState(other.info.tacticalPlan, otherGoals, myGoals);
  return applyTacticModifiers(style, oppStyle, getFormation(me.info.formationId).playStyleAffinity);
}

// ---- Oyuncu seçimi ----
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
  const defender = weightedPick(rng, defenderPool);

  const gk = goalkeeperOf(ctx.defending.info);
  return { attacker, helper, defender, gk };
}

function gkStatFor(eventType: MatchEventType, gk: { ref: number; command: number; distribution: number }): number {
  if (eventType === 'kafa' || eventType === 'korner' || eventType === 'rovasata') return gk.command;
  return gk.ref;
}

// ---- Tek atağın çözümü ----
function resolveDuel(ctx: DuelContext): MatchEvent {
  const { rng } = ctx;
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

  const isAtkCaptain = attacker.id === ctx.attacking.info.captainId;
  const isHelperCaptain = helper.id === ctx.attacking.info.captainId;
  const isDefCaptain = defender.id === ctx.defending.info.captainId;

  // 1) Pozisyona giriş dueli: hücum hamlesi vs savunma
  const helperPerks = resolveHiddenPerkInteraction(rng, helper, isHelperCaptain, eventType, []);
  const attackerPerks = resolveHiddenPerkInteraction(rng, attacker, isAtkCaptain, eventType, []);
  const defenderPerks = resolveHiddenPerkInteraction(rng, defender, isDefCaptain, eventType, [
    ...attackerPerks.triggered,
    ...helperPerks.triggered,
  ]);
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
    ctx.weather.shotControl +
    atkRoll;

  const defenseScore =
    defender.def +
    defenderPerks.bonus +
    (isDefCaptain ? CAPTAIN_BONUS : 0) +
    defTactic.defense +
    defChem +
    defRoll;

  const margin = attackScore - defenseScore;
  let result: EventResult;

  if (margin <= 0) {
    // Atak savunmada bitti
    const r = rng.next();
    if (defenderPerks.triggered.length > 0 && r < 0.5) result = 'blocked';
    else if (r < 0.25) result = 'blocked';
    else if (r < 0.4) result = 'corner-won';
    else result = 'defended';
    hints.push(...defenderPerks.hints);
  } else {
    // 2) Şut vs kaleci
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
      // Yumuşak fren: skor kabardıkça dönüşüm zorlaşır (gerçekçi skor bandı için)
      const totalGoals = ctx.attacking.goals + ctx.defending.goals;
      const runawayPenalty = Math.max(0, ctx.attacking.goals - 1) * 3 + Math.max(0, totalGoals - 3) * 3;
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
        // Kötü vuruş: kaçırma da mümkün
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

  const homeGoals = ctx.attackingSide === 'home' ? ctx.attacking.goals : ctx.defending.goals;
  const awayGoals = ctx.attackingSide === 'home' ? ctx.defending.goals : ctx.attacking.goals;
  const score: [number, number] = [homeGoals, awayGoals];

  const goalState =
    result === 'goal'
      ? ctx.attacking.goals > ctx.defending.goals
        ? ('ahead' as const)
        : ctx.attacking.goals === ctx.defending.goals
          ? ('tie' as const)
          : ('behind' as const)
      : undefined;

  const textLines = ctx.narration.eventLines(eventType, result, {
    minute: ctx.minute,
    attacker: attacker.name,
    helper: helper.name,
    defender: defender.name,
    gk: gk?.name ?? 'kaleci',
    team: ctx.attacking.info.teamName,
    opponent: ctx.defending.info.teamName,
    score: `${score[0]} - ${score[1]}`,
    perkHints: hints,
    goalState,
  });

  return {
    minute: ctx.minute,
    half: ctx.half,
    type: eventType,
    attackingTeam: ctx.attackingSide,
    defendingTeam: ctx.attackingSide === 'home' ? 'away' : 'home',
    playersInvolved: [attacker.id, helper.id, defender.id, ...(gk ? [gk.id] : [])],
    hiddenPerksTriggered: allTriggered,
    hiddenDiceRolls: rolls,
    textLines,
    result,
    scoreAfterEvent: score,
  };
}

// ---- Yarı simülasyonu ----
function pickEventMinutes(rng: Rng, half: 1 | 2, count: number): number[] {
  const [min, max] = half === 1 ? [2, 29] : [32, 59];
  const minutes = new Set<number>();
  let guard = 0;
  while (minutes.size < count && guard < 200) {
    minutes.add(rng.int(min, max));
    guard++;
  }
  return [...minutes].sort((a, b) => a - b);
}

function midStrength(team: TeamMatchInfo): number {
  const fps = fieldPlayersOf(team);
  const mids = fps.filter((p) => p.position === 'MID');
  const midAvg = mids.length > 0 ? mids.reduce((s, p) => s + p.mid, 0) / mids.length : 50;
  return midAvg;
}

export interface HalfContext {
  home: SimTeamState;
  away: SimTeamState;
  rng: Rng;
  narration: NarrationEngine;
  weather?: WeatherModifier;
}

export function generateMatchEvents(ctx: HalfContext, half: 1 | 2): MatchEvent[] {
  const { rng, narration } = ctx;
  const weather = ctx.weather ?? getNeutralWeather();
  const events: MatchEvent[] = [];
  const count = rng.int(4, 6);
  const minutes = pickEventMinutes(rng, half, count);

  for (const minute of minutes) {
    // Pozisyon üretimi: orta saha gücü × taktik temposu × kimya
    const homeTactic = getActiveTacticByScoreState(ctx.home.info.tacticalPlan, ctx.home.goals, ctx.away.goals);
    const awayTactic = getActiveTacticByScoreState(ctx.away.info.tacticalPlan, ctx.away.goals, ctx.home.goals);
    const homeMods = applyTacticModifiers(homeTactic, awayTactic, getFormation(ctx.home.info.formationId).playStyleAffinity);
    const awayMods = applyTacticModifiers(awayTactic, homeTactic, getFormation(ctx.away.info.formationId).playStyleAffinity);

    const homeWeight = midStrength(ctx.home.info) * homeMods.tempo * chemistryTempoFactor(ctx.home.info.chemistry.tier);
    const awayWeight = midStrength(ctx.away.info) * awayMods.tempo * chemistryTempoFactor(ctx.away.info.chemistry.tier);
    const homeAttacks = rng.next() < homeWeight / (homeWeight + awayWeight);

    const duel: DuelContext = {
      rng,
      narration,
      weather,
      attacking: homeAttacks ? ctx.home : ctx.away,
      defending: homeAttacks ? ctx.away : ctx.home,
      attackingSide: homeAttacks ? 'home' : 'away',
      minute,
      half,
    };
    events.push(resolveDuel(duel));
  }
  return events;
}

// ---- Maç sonu değerlendirmeleri ----
export function pickManOfTheMatch(events: MatchEvent[], home: TeamMatchInfo, away: TeamMatchInfo): string | null {
  const impact = new Map<string, number>();
  const add = (id: string, points: number) => impact.set(id, (impact.get(id) ?? 0) + points);
  for (const e of events) {
    const [attackerId, helperId, defenderId, gkId] = e.playersInvolved;
    if (e.result === 'goal') {
      add(attackerId, 5);
      add(helperId, 2);
    } else if (e.result === 'save' && gkId) {
      add(gkId, 3);
    } else if (e.result === 'blocked' || e.result === 'defended') {
      add(defenderId, 2);
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
