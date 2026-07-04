// 1000 maçlık denge simülasyonu — skor dağılımını doğrular.
// Çalıştırma: npm run balance
import { createRng } from '../src/utils/random';
import { findMatchForRun, generateGhostOpponent } from '../src/game/matchmakingEngine';
import { generateMatchEvents, createNarrationEngine, type SimTeamState } from '../src/game/matchEngine';

const MATCHES = 1000;
const rng = createRng(42);

const scoreDist = new Map<string, number>();
let totalGoals = 0;
let totalShots = 0;
let totalEvents = 0;
let draws = 0;
let cleanSheets = 0;
let acrobatics = 0;
let perkTriggers = 0;
const goalCounts: number[] = [];

for (let m = 0; m < MATCHES; m++) {
  // Gerçek oyundaki gibi: rakip, güç bandı eşlemesiyle bulunur
  const homeInfo = generateGhostOpponent(rng);
  const awayInfo = findMatchForRun(rng, homeInfo.power, homeInfo.teamName);
  const home: SimTeamState = { info: homeInfo, goals: 0, acrobaticsUsed: 0 };
  const away: SimTeamState = { info: awayInfo, goals: 0, acrobaticsUsed: 0 };
  const narration = createNarrationEngine(rng);
  const ctx = { home, away, rng, narration };
  const events = [...generateMatchEvents(ctx, 1), ...generateMatchEvents(ctx, 2)];

  const score: [number, number] = [home.goals, away.goals];
  const key = `${Math.max(...score)}-${Math.min(...score)}`;
  scoreDist.set(key, (scoreDist.get(key) ?? 0) + 1);
  totalGoals += home.goals + away.goals;
  goalCounts.push(home.goals + away.goals);
  totalEvents += events.length;
  totalShots += events.filter((e) => ['goal', 'save', 'miss'].includes(e.result)).length;
  if (home.goals === away.goals) draws++;
  if (home.goals === 0 || away.goals === 0) cleanSheets++;
  acrobatics += events.filter((e) => e.type === 'rovasata' || e.type === 'rabona').length;
  perkTriggers += events.filter((e) => e.hiddenPerksTriggered.length > 0).length;
}

console.log(`Maç sayısı: ${MATCHES}`);
console.log(`Ortalama gol/maç: ${(totalGoals / MATCHES).toFixed(2)}`);
console.log(`Ortalama şut/maç: ${(totalShots / MATCHES).toFixed(2)}`);
console.log(`Ortalama önemli an/maç: ${(totalEvents / MATCHES).toFixed(2)}`);
console.log(`Beraberlik oranı: %${((draws / MATCHES) * 100).toFixed(1)}`);
console.log(`Akrobatik an/maç: ${(acrobatics / MATCHES).toFixed(2)}`);
console.log(`Perk etkileşimli event/maç: ${(perkTriggers / MATCHES).toFixed(2)}`);

const sorted = [...scoreDist.entries()].sort((a, b) => b[1] - a[1]);
console.log('\nSkor dağılımı (ilk 12):');
for (const [score, count] of sorted.slice(0, 12)) {
  console.log(`  ${score}: %${((count / MATCHES) * 100).toFixed(1)}`);
}

const high = goalCounts.filter((g) => g >= 7).length;
console.log(`\n7+ gollü maç: %${((high / MATCHES) * 100).toFixed(2)} (hedef: ~%0)`);
