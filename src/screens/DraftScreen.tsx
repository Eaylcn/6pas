import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnyPlayer } from '../types';
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
    rerollUsed,
    openSlot,
    rerollCandidates,
    pickCandidate,
    draftTeamName,
  } = useGameStore();

  const [inspected, setInspected] = useState<AnyPlayer | null>(null);
  const [captainBanner, setCaptainBanner] = useState(false);
  const prevCaptain = useRef<string | null>(captainId);

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
  const totalPicks = squadSlots.length + benchSlots.length;
  const isFirstPick = captainId === null;
  const isBenchSlot = activeSlotId?.startsWith('bench') ?? false;

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

      <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
        <span className="tag-label">
          Seçim {pickedCount} / {totalPicks}
        </span>
        <span className={`tag-label ${rerollUsed ? 'opacity-40' : ''}`}>
          🎲 Yeniden çevirme: {rerollUsed ? 'kullanıldı' : '1 hak'}
        </span>
        {captainBanner && (
          <span className="tag-label bg-ink text-paper border-ink font-bold line-in">Ⓒ KAPTAN BELİRLENDİ</span>
        )}
      </div>

      <div className="grid md:grid-cols-[minmax(280px,420px)_1fr] gap-6">
        <div className="space-y-3">
          <PitchView
            slots={pitchSlots}
            bench={pitchBench}
            captainId={captainId}
            activeSlotId={activeSlotId}
            onSlotClick={openSlot}
            onSelectPlayer={setInspected}
          />
          <ChemistryLegend />
        </div>
        <div className="space-y-3">
          {chemistry && <ChemistryPanel chemistry={chemistry} />}
          {inspected ? (
            <PlayerCard player={inspected} isCaptain={inspected.id === captainId} detailed />
          ) : (
            <div className="news-card p-6 text-center text-ink-soft italic text-sm">
              Sahadan boş bir mevkiye dokun; o pozisyon için üç aday masaya gelsin.
              <br />
              <span className="text-xs">Dolu jetonlara dokunarak kimya bağlarını ve kartları görebilirsin.</span>
            </div>
          )}
        </div>
      </div>

      {/* Aday seçim popup'ı — seçim zorunlu, dışarı tıklayarak kapanmaz */}
      {candidates && activeSlotPosition && (
        <div className="fixed inset-0 z-50 bg-ink/70 overflow-y-auto">
          <div className="min-h-full flex items-start sm:items-center justify-center p-4">
            <div className="news-card max-w-3xl w-full p-5 my-6">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="tag-label">
                {t('draft.pickForSlot', { position: t(`position.${activeSlotPosition}`) })}
              </span>
              {hasIconCandidate && (
                <span className="tag-label bg-gold-foil text-ink border-gold font-bold line-in">
                  ★ MATBAADAN SON DAKİKA: İKON ÇIKTI!
                </span>
              )}
              <button
                className={`tag-label ml-auto ${rerollUsed ? 'opacity-40 cursor-not-allowed' : 'hover:bg-ink hover:text-paper cursor-pointer'}`}
                onClick={rerollCandidates}
                disabled={rerollUsed}
                title="Draft başına bir kez: üç adayı yenileriyle değiştirir"
              >
                🎲 Yeniden Çevir {rerollUsed ? '(kullanıldı)' : '(1 hak)'}
              </button>
            </div>
            {isFirstPick && <p className="text-sm font-semibold text-vermil mb-2">⭐ {t('draft.firstPickNote')}</p>}
            <p className="text-xs italic text-ink-faint mb-3">Seçim zorunlu — üç adaydan birini almadan masadan kalkılmaz.</p>
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
                  detailed
                />
              ))}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
