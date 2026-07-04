import { t } from '../i18n';
import { getFormation } from '../data';
import { SectionHeadline } from '../components/NewspaperShell';
import { TeamPanel } from '../components/TeamPanel';
import { ChemistryPanel } from '../components/ChemistryPanel';
import { calculateTeamPower } from '../game/matchEngine';
import { useGameStore } from '../store/useGameStore';
import { getPlayer } from '../data';
import type { TeamMatchInfo } from '../types';

export function SquadReviewScreen() {
  const { run, findMatch, goto } = useGameStore();
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

  return (
    <div>
      <SectionHeadline sub={t('review.editNote')}>{run.teamName}</SectionHeadline>

      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        <Info label={t('common.formation')} value={formation.name} />
        <Info label={t('common.playStyle')} value={t(`playStyle.${run.defaultPlayStyle}`)} />
        <Info label={t('common.teamPower')} value={team.power} />
        <Info label={t('common.streak')} value={run.streak} />
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-5">
        <TeamPanel team={team} />
        <div className="space-y-4">
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
