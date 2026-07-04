import { useState } from 'react';
import type { FieldPlayer } from '../types';
import { isGoalkeeper } from '../types';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { StylePicker } from './TacticsSetupScreen';
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

  const me = session.home.info;
  const subsLeft = MAX_SUBSTITUTIONS - session.subsUsed;
  const fieldPlayers = me.players.filter((p): p is FieldPlayer => !isGoalkeeper(p));
  const outPlayer = outId ? fieldPlayers.find((p) => p.id === outId) : null;
  const eligibleBench = outPlayer
    ? me.bench.filter((b) => !isGoalkeeper(b) && (b as FieldPlayer).position === outPlayer.position)
    : [];

  const doSub = (inId: string) => {
    if (!outId) return;
    const err = makeSubstitution(outId, inId);
    setError(err);
    if (!err) setOutId(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <SectionHeadline sub={`${session.home.info.teamName} ${session.home.goals} - ${session.away.goals} ${session.away.info.teamName}`}>
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

      <div className="news-card p-4 mb-4">
        <div className="tag-label mb-2">{t('halftime.changeTactics')}</div>
        <div className="mb-3">
          <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('tactics.defaultStyle')}</div>
          <StylePicker small value={me.defaultPlayStyle} onChange={halftimeSetPlayStyle} />
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('tactics.whenWinning')}</div>
            <StylePicker small value={me.tacticalPlan.whenWinning} onChange={(s) => halftimeSetPlan({ whenWinning: s })} />
          </div>
          <div>
            <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('tactics.whenDrawing')}</div>
            <StylePicker small value={me.tacticalPlan.whenDrawing} onChange={(s) => halftimeSetPlan({ whenDrawing: s })} />
          </div>
          <div>
            <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('tactics.whenLosing')}</div>
            <StylePicker small value={me.tacticalPlan.whenLosing} onChange={(s) => halftimeSetPlan({ whenLosing: s })} />
          </div>
        </div>
      </div>

      <div className="news-card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="tag-label">{t('halftime.substitutions')}</span>
          <span className="text-xs font-score uppercase tracking-wider text-ink-soft">
            {t('halftime.subsLeft', { count: subsLeft })}
          </span>
        </div>
        <p className="text-xs italic text-ink-faint mb-2">{t('halftime.samePositionNote')}</p>
        {error && <p className="text-xs font-semibold text-vermil mb-2">{error}</p>}

        {subsLeft > 0 && me.bench.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('halftime.subOut')}</div>
              <div className="space-y-1">
                {fieldPlayers.map((p) => (
                  <button
                    key={p.id}
                    className={`w-full text-left px-2.5 py-1.5 border text-sm ${
                      outId === p.id ? 'border-vermil bg-paper font-bold' : 'border-ink/30 hover:border-ink'
                    }`}
                    onClick={() => setOutId(p.id === outId ? null : p.id)}
                  >
                    <span className="text-[10px] font-score uppercase text-ink-faint mr-2">{t(`position.${p.position}`)}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('halftime.subIn')}</div>
              {outPlayer ? (
                eligibleBench.length > 0 ? (
                  <div className="space-y-1">
                    {eligibleBench.map((p) => (
                      <button
                        key={p.id}
                        className="w-full text-left px-2.5 py-1.5 border border-grass-deep text-sm hover:bg-grass-deep hover:text-paper"
                        onClick={() => doSub(p.id)}
                      >
                        <span className="text-[10px] font-score uppercase mr-2 opacity-70">
                          {t(`position.${(p as FieldPlayer).position}`)}
                        </span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-ink-faint">Bu pozisyonda uygun yedek yok.</p>
                )
              ) : (
                <p className="text-xs italic text-ink-faint">Önce çıkacak oyuncuyu seç.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs italic text-ink-faint">Değişiklik hakkı kalmadı.</p>
        )}
      </div>

      <button className="btn-press w-full text-lg" onClick={startSecondHalf}>
        {t('halftime.startSecondHalf')}
      </button>
    </div>
  );
}
