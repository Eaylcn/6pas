import type { FieldPosition } from '../types';
import { t } from '../i18n';
import { getPlayer } from '../data';
import { SectionHeadline } from '../components/NewspaperShell';
import { PlayerCard } from '../components/PlayerCard';
import { ChemistryPanel } from '../components/ChemistryPanel';
import { calculateTeamChemistry } from '../game/chemistryEngine';
import { useGameStore } from '../store/useGameStore';

export function DraftScreen() {
  const {
    squadSlots,
    benchSlots,
    captainId,
    activeSlotId,
    activeSlotPosition,
    candidates,
    benchPositionPending,
    openSlot,
    chooseBenchPosition,
    pickCandidate,
    draftTeamName,
  } = useGameStore();

  const pickedOnField = squadSlots.filter((s) => s.playerId).map((s) => getPlayer(s.playerId!));
  const chemistry = pickedOnField.length >= 2 ? calculateTeamChemistry(pickedOnField, captainId) : null;
  const isFirstPick = captainId === null;

  return (
    <div>
      <SectionHeadline sub={`${draftTeamName} — ${t('draft.sub')}`}>{t('draft.headline')}</SectionHeadline>

      <div className="grid md:grid-cols-[300px_1fr] gap-5">
        {/* Sol: slotlar */}
        <div className="space-y-4">
          <div>
            <div className="tag-label mb-2">{t('review.startingSix')}</div>
            <div className="space-y-1.5">
              {squadSlots.map((slot) => (
                <SlotRow
                  key={slot.id}
                  label={t(`position.${slot.position}`)}
                  playerName={slot.playerId ? getPlayer(slot.playerId).name : null}
                  isCaptain={slot.playerId !== null && slot.playerId === captainId}
                  active={slot.id === activeSlotId}
                  onClick={() => openSlot(slot.id)}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="tag-label mb-2">{t('common.bench')}</div>
            <div className="space-y-1.5">
              {benchSlots.map((slot) => (
                <SlotRow
                  key={slot.id}
                  label={slot.position ? `${t('draft.benchSlot')} · ${t(`position.${slot.position}`)}` : t('draft.benchSlot')}
                  playerName={slot.playerId ? getPlayer(slot.playerId).name : null}
                  isCaptain={false}
                  active={slot.id === activeSlotId || slot.id === benchPositionPending}
                  onClick={() => openSlot(slot.id)}
                />
              ))}
            </div>
          </div>
          {chemistry && <ChemistryPanel chemistry={chemistry} />}
        </div>

        {/* Sağ: adaylar */}
        <div>
          {benchPositionPending ? (
            <div className="news-card p-5">
              <div className="tag-label mb-3">{t('draft.benchPickPosition')}</div>
              <div className="grid grid-cols-3 gap-2">
                {(['DEF', 'MID', 'ATK'] as FieldPosition[]).map((pos) => (
                  <button key={pos} className="btn-outline" onClick={() => chooseBenchPosition(benchPositionPending, pos)}>
                    {t(`position.${pos}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : candidates && activeSlotPosition ? (
            <div>
              <div className="tag-label mb-2">{t('draft.pickForSlot', { position: t(`position.${activeSlotPosition}`) })}</div>
              {isFirstPick && (
                <p className="text-sm font-semibold text-vermil mb-3">⭐ {t('draft.firstPickNote')}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                {candidates.map((c) => (
                  <PlayerCard key={c.id} player={c} onClick={() => pickCandidate(c.id)} actionLabel={t('draft.choose')} />
                ))}
              </div>
            </div>
          ) : (
            <div className="news-card p-8 text-center text-ink-soft italic">
              Soldan boş bir slot seç; o pozisyon için üç aday masaya gelsin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  label,
  playerName,
  isCaptain,
  active,
  onClick,
}: {
  label: string;
  playerName: string | null;
  isCaptain: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full flex items-center justify-between px-3 py-2 border-2 text-left transition-colors ${
        active
          ? 'border-grass-deep bg-paper'
          : playerName
            ? 'border-ink/25 bg-paper-soft cursor-default'
            : 'border-dashed border-ink/50 hover:border-ink bg-transparent'
      }`}
      onClick={onClick}
    >
      <span className="text-[11px] font-score uppercase tracking-widest text-ink-soft">{label}</span>
      <span className="font-headline font-bold text-sm">
        {playerName ? (
          <>
            {isCaptain && 'Ⓒ '}
            {playerName}
          </>
        ) : (
          <span className="text-ink-faint italic font-body font-normal">{t('draft.slotEmpty')}</span>
        )}
      </span>
    </button>
  );
}
