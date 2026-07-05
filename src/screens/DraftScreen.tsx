import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnyPlayer, FieldPosition } from '../types';
import { t } from '../i18n';
import { getPlayer } from '../data';
import { SectionHeadline } from '../components/NewspaperShell';
import { PlayerCard } from '../components/PlayerCard';
import { ChemistryPanel } from '../components/ChemistryPanel';
import { PitchView, ChemistryLegend, type PitchSlotView } from '../components/PitchView';
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

  const [inspected, setInspected] = useState<AnyPlayer | null>(null);
  const [captainBanner, setCaptainBanner] = useState(false);
  const prevCaptain = useRef<string | null>(captainId);

  // İlk seçim yapıldığında "Kaptan belirlendi" şeridi
  useEffect(() => {
    if (prevCaptain.current === null && captainId) {
      setCaptainBanner(true);
      const timer = setTimeout(() => setCaptainBanner(false), 4000);
      return () => clearTimeout(timer);
    }
    prevCaptain.current = captainId;
  }, [captainId]);

  const pitchSlots: PitchSlotView[] = squadSlots.map((s) => ({
    id: s.id,
    position: s.position,
    player: s.playerId ? getPlayer(s.playerId) : null,
  }));
  const pitchBench: PitchSlotView[] = benchSlots.map((b) => ({
    id: b.id,
    position: b.position ?? 'MID',
    player: b.playerId ? getPlayer(b.playerId) : null,
    label: b.position ? t(`position.${b.position}`) : t('draft.benchSlot'),
  }));

  const pickedOnField = useMemo(
    () => squadSlots.filter((s) => s.playerId).map((s) => getPlayer(s.playerId!)),
    [squadSlots],
  );
  const chemistry = pickedOnField.length >= 2 ? calculateTeamChemistry(pickedOnField, captainId) : null;
  const currentChemScore = chemistry?.score ?? 50;

  const pickedCount =
    squadSlots.filter((s) => s.playerId).length + benchSlots.filter((b) => b.playerId).length;
  const isFirstPick = captainId === null;
  const isBenchSlot = activeSlotId?.startsWith('bench') ?? false;

  // Aday seçilirse kimyanın kaç puan değişeceği (yalnızca ilk 6 slotları için)
  const chemDeltaOf = (candidate: AnyPlayer): number | null => {
    if (isBenchSlot) return null;
    const withCandidate = [...pickedOnField, candidate];
    const nextCaptain = captainId ?? candidate.id;
    return calculateTeamChemistry(withCandidate, nextCaptain).score - currentChemScore;
  };

  const hasIconCandidate = candidates?.some((c) => c.isIcon) ?? false;

  return (
    <div>
      <SectionHeadline sub={`${draftTeamName} — ${t('draft.sub')}`}>{t('draft.headline')}</SectionHeadline>

      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="tag-label">
          Seçim {pickedCount} / 9
        </span>
        {captainBanner && (
          <span className="tag-label bg-ink text-paper border-ink font-bold line-in">Ⓒ KAPTAN BELİRLENDİ</span>
        )}
      </div>

      <div className="grid md:grid-cols-[minmax(280px,380px)_1fr] gap-6">
        {/* Sol: saha krokisi */}
        <div className="space-y-3">
          <PitchView
            slots={pitchSlots}
            bench={pitchBench}
            captainId={captainId}
            activeSlotId={benchPositionPending ?? activeSlotId}
            onSlotClick={openSlot}
            onSelectPlayer={setInspected}
          />
          <ChemistryLegend />
          {chemistry && <ChemistryPanel chemistry={chemistry} />}
          {inspected && (
            <PlayerCard player={inspected} isCaptain={inspected.id === captainId} detailed />
          )}
        </div>

        {/* Sağ: adaylar */}
        <div>
          {benchPositionPending ? (
            <div className="news-card p-5">
              <div className="tag-label mb-3">{t('draft.benchPickPosition')}</div>
              <div className="flex gap-2">
                {(['DEF', 'MID', 'ATK'] as FieldPosition[]).map((pos) => (
                  <button
                    key={pos}
                    className="btn-outline text-sm flex-1"
                    onClick={() => chooseBenchPosition(benchPositionPending, pos)}
                  >
                    {t(`position.${pos}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : candidates && activeSlotPosition ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="tag-label">
                  {t('draft.pickForSlot', { position: t(`position.${activeSlotPosition}`) })}
                </span>
                {hasIconCandidate && (
                  <span className="tag-label bg-gold-foil text-ink border-gold font-bold line-in">
                    ★ MATBAADAN SON DAKİKA: İKON ÇIKTI!
                  </span>
                )}
              </div>
              {isFirstPick && (
                <p className="text-sm font-semibold text-vermil mb-3">⭐ {t('draft.firstPickNote')}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                {candidates.map((c) => (
                  <PlayerCard
                    key={c.id}
                    player={c}
                    onClick={() => pickCandidate(c.id)}
                    actionLabel={t('draft.choose')}
                    statBars
                    chemDelta={chemDeltaOf(c)}
                    revealIcon
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="news-card p-8 text-center text-ink-soft italic">
              Sahadan boş bir mevkiye dokun; o pozisyon için üç aday masaya gelsin.
              <br />
              <span className="text-xs">Dolu jetonlara dokunarak kimya bağlarını görebilirsin.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
