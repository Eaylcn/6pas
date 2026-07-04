import type { PlayStyle } from '../types';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useGameStore } from '../store/useGameStore';

const styles: PlayStyle[] = ['ofansif', 'dengeli', 'defansif', 'kontra'];

export function StylePicker({
  value,
  onChange,
  small,
}: {
  value: PlayStyle;
  onChange: (s: PlayStyle) => void;
  small?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {styles.map((s) => (
        <button
          key={s}
          className={`border-2 font-headline font-bold uppercase transition-colors ${small ? 'text-[11px] py-1.5' : 'text-sm py-2'} ${
            value === s ? 'bg-ink text-paper border-ink' : 'border-ink/40 text-ink-soft hover:border-ink'
          }`}
          onClick={() => onChange(s)}
        >
          {t(`playStyle.${s}`)}
        </button>
      ))}
    </div>
  );
}

export function TacticsSetupScreen() {
  const { draftPlayStyle, setPlayStyle, draftPlan, setPlan, confirmTactics, goto } = useGameStore();

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeadline>{t('tactics.headline')}</SectionHeadline>

      <div className="news-card p-5 mb-4">
        <div className="tag-label mb-2">{t('tactics.defaultStyle')}</div>
        <StylePicker value={draftPlayStyle} onChange={setPlayStyle} />
        <p className="text-xs text-ink-soft italic mt-2">{t(`playStyleDesc.${draftPlayStyle}`)}</p>
      </div>

      <div className="news-card p-5 mb-5">
        <div className="tag-label mb-3">{t('tactics.planTitle')}</div>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('tactics.whenWinning')}</div>
            <StylePicker small value={draftPlan.whenWinning} onChange={(s) => setPlan({ whenWinning: s })} />
          </div>
          <div>
            <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('tactics.whenDrawing')}</div>
            <StylePicker small value={draftPlan.whenDrawing} onChange={(s) => setPlan({ whenDrawing: s })} />
          </div>
          <div>
            <div className="text-xs font-score uppercase tracking-widest text-ink-soft mb-1">{t('tactics.whenLosing')}</div>
            <StylePicker small value={draftPlan.whenLosing} onChange={(s) => setPlan({ whenLosing: s })} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-outline flex-1" onClick={() => goto('formation')}>
          {t('common.back')}
        </button>
        <button className="btn-press flex-1" onClick={confirmTactics}>
          {t('tactics.toDraft')}
        </button>
      </div>
    </div>
  );
}
