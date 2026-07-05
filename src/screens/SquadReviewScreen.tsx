import { useState } from 'react';
import { t } from '../i18n';
import { getFormation, getPlayer } from '../data';
import { SectionHeadline } from '../components/NewspaperShell';
import { PlayerCard } from '../components/PlayerCard';
import { ChemistryPanel } from '../components/ChemistryPanel';
import { PitchView, ChemistryLegend, type PitchSlotView } from '../components/PitchView';
import { calculateTeamPower } from '../game/matchEngine';
import { useGameStore } from '../store/useGameStore';
import type { AnyPlayer, TeamMatchInfo } from '../types';

export function SquadReviewScreen() {
  const { run, findMatch, goto } = useGameStore();
  const [inspected, setInspected] = useState<AnyPlayer | null>(null);
  if (!run) return null;

  const players = run.squad.filter((s) => s.playerId).map((s) => getPlayer(s.playerId!));
  const bench = run.bench.filter((b) => b.playerId).map((b) => getPlayer(b.playerId!));
  const team: TeamMatchInfo = {
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
  team.power = calculateTeamPower(team);
  const formation = getFormation(run.formationId);

  const pitchSlots: PitchSlotView[] = players.map((p) => ({ id: p.id, position: p.position, player: p }));
  const pitchBench: PitchSlotView[] = bench.map((p) => ({ id: p.id, position: p.position, player: p }));

  return (
    <div>
      <SectionHeadline sub={t('review.editNote')}>{run.teamName}</SectionHeadline>

      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        <Info label={t('common.formation')} value={formation.name} />
        <Info label={t('common.playStyle')} value={t(`playStyle.${run.defaultPlayStyle}`)} />
        <Info label={t('common.teamPower')} value={team.power} />
        <Info label={t('common.streak')} value={run.streak} />
      </div>

      <div className="grid md:grid-cols-[minmax(280px,400px)_1fr] gap-6">
        <div className="space-y-3">
          <PitchView
            slots={pitchSlots}
            bench={pitchBench}
            captainId={run.captainId}
            onSelectPlayer={setInspected}
          />
          <ChemistryLegend />
        </div>
        <div className="space-y-4">
          {inspected ? (
            <PlayerCard player={inspected} isCaptain={inspected.id === run.captainId} detailed />
          ) : (
            <div className="news-card p-4 text-sm italic text-ink-soft text-center">
              Sahadaki bir jetona dokun: kartı ve kimya bağları burada açılır.
            </div>
          )}
          <ChemistryPanel chemistry={run.chemistry} />
          <div className="news-card p-3 text-xs space-y-1">
            <div className="tag-label mb-1">{t('common.tacticalPlan')}</div>
            <p>
              {t('tactics.whenWinning')}: <b>{t(`playStyle.${run.tacticalPlan.whenWinning}`)}</b>
            </p>
            <p>
              {t('tactics.whenDrawing')}: <b>{t(`playStyle.${run.tacticalPlan.whenDrawing}`)}</b>
            </p>
            <p>
              {t('tactics.whenLosing')}: <b>{t(`playStyle.${run.tacticalPlan.whenLosing}`)}</b>
            </p>
          </div>
          <button className="btn-press w-full text-lg" onClick={findMatch}>
            ⚽ {t('review.findMatch')}
          </button>
          <button className="btn-outline w-full" onClick={() => goto('home')}>
            {t('common.back')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="news-card p-3 text-center">
      <div className="font-headline font-bold text-xl">{value}</div>
      <div className="text-[10px] font-score uppercase tracking-widest text-ink-soft mt-0.5">{label}</div>
    </div>
  );
}
