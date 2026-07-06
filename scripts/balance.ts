// 1000 maçlık denge simülasyonu — skor/kart/duran top/sakatlık dağılımını doğrular.
// Çalıştırma: npm run balance
import { createRng } from '../src/utils/random';
import { findMatchForRun, generateGhostOpponent } from '../src/game/matchmakingEngine';
import {
  createMatchSim,
  planPhaseMinutes,
  produceEvent,
  simulatePenaltyShootout,
} from '../src/game/matchEngine';
import type { MatchEvent } from '../src/types';

const MATCHES = 1000;
const rng = createRng(42);

const scoreDist = new Map<string, number>();
let totalGoals = 0;
let totalShots = 0;
let totalEvents = 0;
let extraTimes = 0;
let shootouts = 0;
let acrobatics = 0;
let perkTriggers = 0;
let fouls = 0;
let yellows = 0;
let reds = 0;
let injuries = 0;
let pensInMatch = 0;
let freeKicks = 0;
let fkGoals = 0;
let penGoals = 0;
let autoSubs = 0;
let saves = 0;
let misses = 0;
let blocks = 0;
const goalCounts: number[] = [];

for (let m = 0; m < MATCHES; m++) {
  const homeInfo = generateGhostOpponent(rng);
  const awayInfo = findMatchForRun(rng, homeInfo.power, homeInfo.teamName);
  const sim = createMatchSim(homeInfo, awayInfo, rng);
  const events: MatchEvent[] = [];

  for (const phase of ['H1', 'H2'] as const) {
    for (const minute of planPhaseMinutes(rng, phase)) {
      events.push(...produceEvent(sim, minute, phase === 'H1' ? 1 : 2));
    }
  }
  if (sim.home.goals === sim.away.goals) {
    extraTimes++;
    for (const minute of planPhaseMinutes(rng, 'ET')) {
      events.push(...produceEvent(sim, minute, 2));
    }
    if (sim.home.goals === sim.away.goals) {
      shootouts++;
      simulatePenaltyShootout(rng, sim.home.info, sim.away.info);
    }
  }

  const score: [number, number] = [sim.home.goals, sim.away.goals];
  const key = `${Math.max(...score)}-${Math.min(...score)}`;
  scoreDist.set(key, (scoreDist.get(key) ?? 0) + 1);
  totalGoals += score[0] + score[1];
  goalCounts.push(score[0] + score[1]);
  totalEvents += events.length;
  totalShots += events.filter((e) => ['goal', 'save', 'miss'].includes(e.result)).length;
  saves += events.filter((e) => e.result === 'save').length;
  misses += events.filter((e) => e.result === 'miss').length;
  blocks += events.filter((e) => e.result === 'blocked' || e.result === 'defended').length;
  acrobatics += events.filter((e) => e.type === 'rovasata' || e.type === 'rabona').length;
  perkTriggers += events.filter((e) => e.hiddenPerksTriggered.length > 0).length;
  fouls += events.filter((e) => e.type === 'faul').length;
  yellows += events.filter((e) => e.card === 'yellow').length;
  reds += events.filter((e) => e.card === 'red').length;
  injuries += events.filter((e) => e.result === 'injury').length;
  pensInMatch += events.filter((e) => e.type === 'penalti').length;
  penGoals += events.filter((e) => e.type === 'penalti' && e.result === 'goal').length;
  freeKicks += events.filter((e) => e.type === 'serbest-vurus').length;
  fkGoals += events.filter((e) => e.type === 'serbest-vurus' && e.result === 'goal').length;
  autoSubs += events.filter((e) => e.result === 'substitution').length;
}

console.log(`Maç sayısı: ${MATCHES}`);
console.log(`Ortalama gol/maç: ${(totalGoals / MATCHES).toFixed(2)}`);
console.log(`Ortalama şut/maç: ${(totalShots / MATCHES).toFixed(2)}`);
console.log(
  `Kurtarış/maç: ${(saves / MATCHES).toFixed(2)} · Kaçan/maç: ${(misses / MATCHES).toFixed(2)} · Blok+müdahale/maç: ${(blocks / MATCHES).toFixed(2)}`,
);
console.log(`Ortalama önemli an/maç: ${(totalEvents / MATCHES).toFixed(2)}`);
console.log(`Uzatmaya giden: %${((extraTimes / MATCHES) * 100).toFixed(1)} · Penaltılara giden: %${((shootouts / MATCHES) * 100).toFixed(1)}`);
console.log(`Faul/maç: ${(fouls / MATCHES).toFixed(2)} · Sarı/maç: ${(yellows / MATCHES).toFixed(2)} · Kırmızı: %${((reds / MATCHES) * 100).toFixed(1)} maç`);
console.log(`Maç içi penaltı: %${((pensInMatch / MATCHES) * 100).toFixed(1)} (gol oranı %${pensInMatch ? ((penGoals / pensInMatch) * 100).toFixed(0) : 0})`);
console.log(`Serbest vuruş/maç: ${(freeKicks / MATCHES).toFixed(2)} (gol oranı %${freeKicks ? ((fkGoals / freeKicks) * 100).toFixed(0) : 0})`);
console.log(`Sakatlık: %${((injuries / MATCHES) * 100).toFixed(1)} maç · Oto değişiklik/maç: ${(autoSubs / MATCHES).toFixed(2)}`);
console.log(`Akrobatik an/maç: ${(acrobatics / MATCHES).toFixed(2)} · Perk etkileşimli event/maç: ${(perkTriggers / MATCHES).toFixed(2)}`);

const sorted = [...scoreDist.entries()].sort((a, b) => b[1] - a[1]);
console.log('\nSkor dağılımı (ilk 12):');
for (const [score, count] of sorted.slice(0, 12)) {
  console.log(`  ${score}: %${((count / MATCHES) * 100).toFixed(1)}`);
}

const high = goalCounts.filter((g) => g >= 7).length;
console.log(`\n7+ gollü maç: %${((high / MATCHES) * 100).toFixed(2)} (hedef: ~%0-1)`);
