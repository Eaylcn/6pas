import { useState } from 'react';
import type { AnyPlayer } from '../types';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { PlayerCard } from '../components/PlayerCard';
import { PitchView, ChemistryLegend, type PitchSlotView } from '../components/PitchView';
import { useGameStore } from '../store/useGameStore';

export function MatchmakingScreen() {
  const { run, opponent, opponentFound, startMatch } = useGameStore();
  const [scouted, setScouted] = useState<AnyPlayer | null>(null);
  if (!run) return null;

  if (!opponentFound || !opponent) {
    return (
      <div className="max-w-md mx-auto text-center">
        <SectionHeadline sub={t('matchmaking.sub')}>{t('matchmaking.headline')}</SectionHeadline>
        <div className="news-card p-10">
          <div className="font-headline text-5xl animate-pulse">⚽</div>
          <p className="mt-4 text-sm font-score uppercase tracking-widest text-ink-soft animate-pulse">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  const pitchSlots: PitchSlotView[] = opponent.players.map((p) => ({ id: p.id, position: p.position, player: p }));
  const pitchBench: PitchSlotView[] = opponent.bench.map((p) => ({ id: p.id, position: p.position, player: p }));

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeadline sub={t('matchmaking.vs')}>{t('matchmaking.found')}</SectionHeadline>
      <div className="news-card p-4 mb-4 text-center">
        <span className="font-headline font-bold text-xl">{run.teamName}</span>
        <span className="font-score text-ink-soft mx-3 text-lg">—</span>
        <span className="font-headline font-bold text-xl">{opponent.teamName}</span>
        <div className="text-[11px] font-score uppercase tracking-widest text-ink-soft mt-1">
          {t('common.teamPower')}: {opponent.power} · {t('common.chemistry')}: {opponent.chemistry.score}
          {opponent.managerName ? ` · TD: ${opponent.managerName}` : ''}
        </div>
      </div>
      <div className="grid md:grid-cols-[minmax(280px,400px)_1fr] gap-5 mb-5">
        <div className="news-card p-4">
          <div className="tag-label mb-2">Rakip Dizilişi — {opponent.formationId}</div>
          <PitchView
            slots={pitchSlots}
            bench={pitchBench}
            captainId={opponent.captainId}
            onSelectPlayer={setScouted}
          />
          <div className="mt-2">
            <ChemistryLegend />
          </div>
        </div>
        <div className="space-y-3">
          {scouted ? (
            <PlayerCard player={scouted} isCaptain={scouted.id === opponent.captainId} detailed />
          ) : (
            <div className="news-card p-6 text-center text-sm italic text-ink-soft">
              🔍 Rakip oyunculara dokunarak keşif raporunu aç: statlar, perkler ve kimya bağları.
            </div>
          )}
          <button className="btn-press w-full text-lg" onClick={startMatch}>
            {t('matchmaking.startMatch')}
          </button>
        </div>
      </div>
    </div>
  );
}
