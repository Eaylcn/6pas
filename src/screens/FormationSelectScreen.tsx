import { t } from '../i18n';
import { formations } from '../data';
import { SectionHeadline } from '../components/NewspaperShell';
import { useGameStore } from '../store/useGameStore';

export function FormationSelectScreen() {
  const { draftFormationId, setFormation, goto } = useGameStore();

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeadline sub={t('formationScreen.sub')}>{t('formationScreen.headline')}</SectionHeadline>
      <div className="space-y-3">
        {formations.map((f) => {
          const active = f.id === draftFormationId;
          return (
            <button
              key={f.id}
              className={`w-full p-4 text-left ${active ? 'news-card border-2 !border-grass-deep bg-paper' : 'news-card-clickable'}`}
              onClick={() => setFormation(f.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-headline font-black text-2xl tracking-wider">{f.name}</span>
                <span className="text-[11px] font-score uppercase tracking-widest text-ink-soft">
                  {f.defSlots} {t('position.DEF')} · {f.midSlots} {t('position.MID')} · {f.atkSlots} {t('position.ATK')}
                </span>
              </div>
              <p className="text-sm text-ink-soft mt-1">{f.description}</p>
              {active && <div className="tag-label mt-2 bg-grass-deep text-paper border-grass-deep">SEÇİLDİ</div>}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 mt-5">
        <button className="btn-outline flex-1" onClick={() => goto('team-name')}>
          {t('common.back')}
        </button>
        <button className="btn-press flex-1" onClick={() => goto('tactics')}>
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
}
