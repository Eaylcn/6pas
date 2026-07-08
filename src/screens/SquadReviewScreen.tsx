import { useMemo, useState } from 'react';
import { t } from '../i18n';
import { getFormation, getPlayer } from '../data';
import { SectionHeadline } from '../components/NewspaperShell';
import { PlayerCard } from '../components/PlayerCard';
import { ChemistryPanel } from '../components/ChemistryPanel';
import { PitchView, ChemistryLegend, type PitchSlotView } from '../components/PitchView';
import { StylePicker } from './TacticsSetupScreen';
import { calculateTeamPower } from '../game/matchEngine';
import { outOfPositionCount, useGameStore } from '../store/useGameStore';
import type { AnyPlayer, TeamMatchInfo } from '../types';

export function SquadReviewScreen() {
  const { run, findMatch, goto, swapWithBench, updateRunTactics } = useGameStore();
  const [inspected, setInspected] = useState<AnyPlayer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const [selectedFieldSlot, setSelectedFieldSlot] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
  const oopCount = outOfPositionCount(run.squad);

  // Slot id'leri run'dan gelir (takas için gerekli)
  const pitchSlots: PitchSlotView[] = run.squad.map((s) => ({
    id: s.id,
    position: s.position,
    player: s.playerId ? getPlayer(s.playerId) : null,
  }));
  const pitchBench: PitchSlotView[] = run.bench.map((b) => ({
    id: b.id,
    position: b.position ?? 'MID',
    player: b.playerId ? getPlayer(b.playerId) : null,
  }));

  const selectedSlot = selectedFieldSlot ? run.squad.find((s) => s.id === selectedFieldSlot) : null;
  const eligibleBenchIds = useMemo(() => {
    if (!editMode || !selectedSlot) return new Set<string>();
    const wantGk = selectedSlot.position === 'GK';
    return new Set(
      run.bench
        .filter((b) => b.playerId && (getPlayer(b.playerId!).position === 'GK') === wantGk)
        .map((b) => b.playerId!),
    );
  }, [editMode, selectedSlot, run.bench]);

  const handleToken = (player: AnyPlayer, isBench: boolean) => {
    setNotice(null);
    if (!editMode) {
      setInspected(player);
      return;
    }
    if (!isBench) {
      const slot = run.squad.find((s) => s.playerId === player.id);
      if (!slot) return;
      setSelectedFieldSlot(slot.id === selectedFieldSlot ? null : slot.id);
      return;
    }
    // Kulübeden oyuncu: seçili saha slotuyla takas
    if (!selectedFieldSlot) {
      setNotice('Önce sahadan değişecek oyuncuyu seç.');
      return;
    }
    const benchSlot = run.bench.find((b) => b.playerId === player.id);
    if (!benchSlot) return;
    void swapWithBench(selectedFieldSlot, benchSlot.id).then(({ error, warning }) => {
      setNotice(error ?? warning ?? null);
      if (!error) setSelectedFieldSlot(null);
    });
  };

  return (
    <div>
      <SectionHeadline sub={t('review.editNote')}>{run.teamName}</SectionHeadline>

      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        <Info label={t('common.formation')} value={formation.name} />
        <Info label={t('common.playStyle')} value={t(`playStyle.${run.defaultPlayStyle}`)} />
        <Info label={t('common.teamPower')} value={team.power} />
        <Info label={t('common.streak')} value={run.streak} />
      </div>

      <div className="grid md:grid-cols-[minmax(280px,420px)_1fr] gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              className={`tag-label cursor-pointer ${editMode ? 'bg-vermil text-paper border-vermil' : 'hover:bg-ink hover:text-paper'}`}
              onClick={() => {
                setEditMode((e) => !e);
                setSelectedFieldSlot(null);
                setNotice(null);
              }}
            >
              {editMode ? '✕ Düzenlemeyi Bitir' : '✎ Kadroyu Düzenle'}
            </button>
            {oopCount > 0 && <span className="tag-label text-vermil border-vermil">‼ {oopCount} mevki dışı</span>}
          </div>
          {editMode && (
            <p className="text-xs italic text-ink-soft">
              {selectedSlot
                ? 'Şimdi kulübeden girecek oyuncuya dokun (yeşil vurgulular uygun).'
                : 'Sahadan değişecek oyuncuya dokun, sonra kulübeden yerine geçecek ismi seç. Mevki dışı takas serbest ama kimyayı bozar.'}
            </p>
          )}
          {notice && <p className="text-xs font-semibold text-vermil">{notice}</p>}
          <PitchView
            slots={pitchSlots}
            bench={pitchBench}
            captainId={run.captainId}
            onTokenClick={handleToken}
            selectedPlayerId={editMode ? selectedSlot?.playerId ?? null : undefined}
            emphasisIds={eligibleBenchIds}
            showChemistry={!editMode}
            onSelectPlayer={editMode ? undefined : setInspected}
          />
          <ChemistryLegend />
        </div>
        <div className="space-y-4">
          {inspected && !editMode ? (
            <PlayerCard player={inspected} isCaptain={inspected.id === run.captainId} detailed />
          ) : (
            <div className="news-card p-4 text-sm italic text-ink-soft text-center">
              {editMode
                ? 'Düzenleme modundasın — takaslar anında kaydedilir.'
                : 'Sahadaki bir jetona dokun: kartı ve kimya bağları burada açılır.'}
            </div>
          )}
          <ChemistryPanel chemistry={run.chemistry} />

          {/* Taktik düzenleme — tüm modlarda maç öncesi ayarlanabilir */}
          <div className="news-card p-3">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setTacticsOpen((o) => !o)}
            >
              <span className="tag-label">{t('common.tacticalPlan')} · düzenle</span>
              <span className="font-score text-ink-faint">{tacticsOpen ? '−' : '⚙'}</span>
            </button>

            {tacticsOpen ? (
              <div className="mt-2 space-y-2.5">
                <div>
                  <div className="text-[10px] font-score uppercase tracking-widest text-ink-soft mb-1">
                    {t('tactics.defaultStyle')}
                  </div>
                  <StylePicker small value={run.defaultPlayStyle} onChange={(s) => void updateRunTactics(s, null)} />
                </div>
                <div>
                  <div className="text-[10px] font-score uppercase tracking-widest text-ink-soft mb-1">
                    {t('tactics.whenWinning')}
                  </div>
                  <StylePicker small value={run.tacticalPlan.whenWinning} onChange={(s) => void updateRunTactics(null, { whenWinning: s })} />
                </div>
                <div>
                  <div className="text-[10px] font-score uppercase tracking-widest text-ink-soft mb-1">
                    {t('tactics.whenDrawing')}
                  </div>
                  <StylePicker small value={run.tacticalPlan.whenDrawing} onChange={(s) => void updateRunTactics(null, { whenDrawing: s })} />
                </div>
                <div>
                  <div className="text-[10px] font-score uppercase tracking-widest text-ink-soft mb-1">
                    {t('tactics.whenLosing')}
                  </div>
                  <StylePicker small value={run.tacticalPlan.whenLosing} onChange={(s) => void updateRunTactics(null, { whenLosing: s })} />
                </div>
              </div>
            ) : (
              <div className="mt-1.5 text-xs space-y-0.5">
                <p>
                  {t('tactics.defaultStyle')}: <b>{t(`playStyle.${run.defaultPlayStyle}`)}</b>
                </p>
                <p>
                  {t('tactics.whenWinning')}: <b>{t(`playStyle.${run.tacticalPlan.whenWinning}`)}</b> ·{' '}
                  {t('tactics.whenDrawing')}: <b>{t(`playStyle.${run.tacticalPlan.whenDrawing}`)}</b> ·{' '}
                  {t('tactics.whenLosing')}: <b>{t(`playStyle.${run.tacticalPlan.whenLosing}`)}</b>
                </p>
              </div>
            )}
          </div>
          <button className="btn-press w-full text-lg" onClick={findMatch}>
            ⚽ {t('review.findMatch')}
          </button>
          {run.mode === 'tournament' && run.bracket && (
            <button className="btn-outline w-full" onClick={() => goto('bracket')}>
              🏆 Turnuva Ağacı
            </button>
          )}
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
