import { useMemo, useState } from 'react';
import type { AnyPlayer, FieldPlayer } from '../types';
import { isGoalkeeper } from '../types';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { StylePicker } from './TacticsSetupScreen';
import { PitchView, type PitchSlotView } from '../components/PitchView';
import { MAX_SUBSTITUTIONS } from '../game/halftimeEngine';
import { useGameStore } from '../store/useGameStore';

export function HalfTimeScreen() {
  const {
    session,
    halftimeSummary,
    halftimeSetPlayStyle,
    halftimeSetPlan,
    makeSubstitution,
    startSecondHalf,
    run,
  } = useGameStore();
  const [outId, setOutId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!session || !run) return null;

  const me = session.sim.home.info;
  const subsLeft = MAX_SUBSTITUTIONS - session.sim.home.subsUsed;

  const pitchSlots: PitchSlotView[] = me.players.map((p) => ({ id: p.id, position: p.position, player: p }));
  const pitchBench: PitchSlotView[] = me.bench.map((p) => ({ id: p.id, position: p.position, player: p }));

  const outPlayer = outId ? me.players.find((p) => p.id === outId) : undefined;
  const eligibleIds = useMemo(() => {
    if (!outPlayer) return new Set<string>();
    return new Set(me.bench.filter((b) => b.position === outPlayer.position).map((b) => b.id));
  }, [me.bench, outPlayer]);

  const handleToken = (player: AnyPlayer, isBench: boolean) => {
    setError(null);
    if (subsLeft <= 0) {
      setError('Değişiklik hakkı kalmadı.');
      return;
    }
    if (!isBench) {
      setOutId(player.id === outId ? null : player.id);
      return;
    }
    // Kulübeden oyuncu: çıkacak oyuncu seçiliyse ve pozisyon uyuyorsa değişikliği yap
    if (!outId) {
      setError('Önce sahadan çıkacak oyuncuyu seç.');
      return;
    }
    if (!eligibleIds.has(player.id)) {
      setError(t('halftime.samePositionNote'));
      return;
    }
    const err = makeSubstitution(outId, player.id);
    setError(err);
    if (!err) setOutId(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeadline
        sub={`${session.sim.home.info.teamName} ${session.sim.home.goals} - ${session.sim.away.goals} ${session.sim.away.info.teamName}`}
      >
        {t('halftime.headline')}
      </SectionHeadline>

      <div className="news-card p-4 mb-4">
        <div className="tag-label mb-2">{t('halftime.summaryTitle')}</div>
        {halftimeSummary.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed mb-1">
            {line}
          </p>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <div className="news-card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="tag-label">{t('halftime.substitutions')}</span>
            <span className="text-xs font-score uppercase tracking-wider text-ink-soft">
              {t('halftime.subsLeft', { count: subsLeft })}
            </span>
          </div>
          <p className="text-xs italic text-ink-faint mb-2">
            {outPlayer
              ? `${outPlayer.name} çıkacak — kulübeden uygun (yeşil) bir isme dokun.`
              : 'Sahadan çıkacak oyuncuya dokun, sonra kulübeden girecek ismi seç.'}
          </p>
          {error && <p className="text-xs font-semibold text-vermil mb-2">{error}</p>}
          <PitchView
            slots={pitchSlots}
            bench={pitchBench}
            captainId={me.captainId}
            onTokenClick={handleToken}
            selectedPlayerId={outId}
            emphasisIds={eligibleIds}
            showChemistry={false}
          />
        </div>

        <div className="news-card p-4">
          <div className="tag-label mb-2">{t('halftime.changeTactics')}</div>
          <div className="mb-3">
            <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">
              {t('tactics.defaultStyle')}
            </div>
            <StylePicker small value={me.defaultPlayStyle} onChange={halftimeSetPlayStyle} />
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">
                {t('tactics.whenWinning')}
              </div>
              <StylePicker small value={me.tacticalPlan.whenWinning} onChange={(s) => halftimeSetPlan({ whenWinning: s })} />
            </div>
            <div>
              <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">
                {t('tactics.whenDrawing')}
              </div>
              <StylePicker small value={me.tacticalPlan.whenDrawing} onChange={(s) => halftimeSetPlan({ whenDrawing: s })} />
            </div>
            <div>
              <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">
                {t('tactics.whenLosing')}
              </div>
              <StylePicker small value={me.tacticalPlan.whenLosing} onChange={(s) => halftimeSetPlan({ whenLosing: s })} />
            </div>
          </div>
        </div>
      </div>

      <button className="btn-press w-full text-lg" onClick={startSecondHalf}>
        {t('halftime.startSecondHalf')}
      </button>
    </div>
  );
}
