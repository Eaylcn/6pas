import type { ChemistryBreakdown, GameMode, PlayStyle, Run, SquadSlot, BenchSlot, TacticalPlan } from '../types';
import { uid } from '../utils/random';
import { load, save, remove } from './storage';

const RUN_KEY = 'activeRun';

export async function getActiveRun(): Promise<Run | null> {
  const run = await load<Run>(RUN_KEY);
  return run && run.status === 'active' ? run : null;
}

export async function createNewRun(input: {
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
}): Promise<Run> {
  const run: Run = {
    id: uid('run'),
    ...input,
    wins: 0,
    losses: 0,
    streak: 0,
    pointsEarned: 0,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await save(RUN_KEY, run);
  return run;
}

export async function saveRun(run: Run): Promise<void> {
  await save(RUN_KEY, { ...run, updatedAt: Date.now() });
}

export async function continueRunAfterWin(run: Run, pointsGained: number, newStreak: number): Promise<Run> {
  const updated: Run = {
    ...run,
    wins: run.wins + 1,
    streak: newStreak,
    pointsEarned: run.pointsEarned + pointsGained,
    updatedAt: Date.now(),
  };
  await save(RUN_KEY, updated);
  return updated;
}

export async function eliminateRun(run: Run): Promise<Run> {
  const updated: Run = { ...run, losses: run.losses + 1, streak: 0, status: 'eliminated', updatedAt: Date.now() };
  await remove(RUN_KEY);
  return updated;
}
