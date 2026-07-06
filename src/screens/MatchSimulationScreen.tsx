import { useEffect, useMemo, useRef, useState } from 'react';
import type { FieldPlayer, MatchEvent, PlayStyle } from '../types';
import { isGoalkeeper } from '../types';
import { getPlayer, getPerk } from '../data';
import { t } from '../i18n';
import { Scoreboard } from '../components/Scoreboard';
import { LivePitch, type BallCue } from '../components/LivePitch';
import { StylePicker } from './TacticsSetupScreen';
import {
  totalLines,
  useGameStore,
  MAX_SUBSTITUTIONS,
  MAX_INMATCH_TACTIC_CHANGES,
  type MatchPhase,
  type MatchSession,
} from '../store/useGameStore';
import { getActiveTacticByScoreState as getActiveTactic } from '../game/tacticsEngine';
import { computeMatchRatings, ratingTone } from '../game/ratingsEngine';
import { getAssistantAdvice } from '../game/assistantEngine';
import type { SimTeamState } from '../game/matchEngine';

const PHASE_START: Record<MatchPhase, number> = { H1: 1, H2: 31, ET: 61, PENS: 70 };
const PHASE_END: Record<MatchPhase, number> = { H1: 30, H2: 60, ET: 70, PENS: 70 };

/** Canlı reytingli kadro paneli (PC: yan sütun, mobil: log altı) — kart/sakatlık/değişiklik ikonlu */
function RosterPanel({ state, side, events }: { state: SimTeamState; side: 'home' | 'away'; events: MatchEvent[] }) {
  const ratings = computeMatchRatings(events, state, side);
  const toneClass = { great: 'bg-grass text-paper', good: 'bg-ink text-paper', poor: 'bg-vermil text-paper' };

  // Durum ikonları AÇILMIŞ olaylardan türetilir — spoiler sızmaz
  const yellows = new Set<string>();
  const reds = new Set<string>();
  const injured = new Set<string>();
  const subbedOut = new Set<string>();
  for (const e of events) {
    if (e.card && e.cardPlayerId && e.defendingTeam === side) {
      if (e.card === 'red') reds.add(e.cardPlayerId);
      else yellows.add(e.cardPlayerId);
    }
    if (e.result === 'injury' && e.injuryPlayerId && e.attackingTeam === side) injured.add(e.injuryPlayerId);
    if (e.subOutId && e.attackingTeam === side) subbedOut.add(e.subOutId);
  }

  return (
    <div className="news-card p-2.5">
      <div
        className={`text-[10px] font-score uppercase tracking-widest mb-1.5 truncate ${
          side === 'home' ? 'text-grass-deep' : 'text-vermil'
        }`}
      >
        {state.info.teamName}
      </div>
      <div className="space-y-1">
        {ratings.map((r) => {
          const parts = r.player.name.split(' ');
          const short = parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : r.player.name;
          const id = r.player.id;
          const offField = reds.has(id) || injured.has(id) || subbedOut.has(id);
          const marks = [
            reds.has(id) ? '🟥' : yellows.has(id) ? '🟨' : null,
            injured.has(id) ? '⚕️' : null,
            !reds.has(id) && !injured.has(id) && subbedOut.has(id) ? '🔁' : null,
          ]
            .filter(Boolean)
            .join('');
          return (
            <div key={id} className={`flex items-center gap-1.5 text-[11px] ${offField ? 'opacity-50' : ''}`}>
              <span className={`font-score font-bold px-1 min-w-[26px] text-center ${toneClass[ratingTone(r.rating)]}`}>
                {r.rating.toFixed(1)}
              </span>
              <span className="truncate">{short}</span>
              {marks && <span className="text-[10px] leading-none shrink-0">{marks}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FlatLine {
  text: string;
  minute: number;
  score: [number, number];
  isGoal: boolean;
  isResult: boolean;
  isSuspense: boolean;
  /** Gol sonrası kutlama cümlesi — küçük saha notu olarak düşer */
  isAftermath?: boolean;
  icon: string | null;
  /** Perk tetiklendiğinde sonuç satırının altına düşen "muhabir notu" */
  perkNote: string | null;
  /** Atağı yapan taraf — kim kimin oyuncusu karışmasın */
  side: 'home' | 'away' | null;
  /** Olay bloğunun ilk satırı (takım etiketi buraya basılır) */
  isEventStart: boolean;
  /** Canlı saha topu için ipucu */
  cue: BallCue;
}

function resultIcon(e: MatchEvent, lineIndex: number, lineCount: number): string | null {
  const isLast = lineIndex === lineCount - 1;
  if (!isLast) {
    // Kart satırı faul eventinin son satırıdır; faulde ilk satır ⚠
    if (e.type === 'faul' && lineIndex === 0) return '⚠️';
    return null;
  }
  switch (e.result) {
    case 'goal':
      return '⚽';
    case 'save':
      return '🧤';
    case 'corner-won':
      return '🚩';
    case 'substitution':
      return '🔁';
    case 'injury':
      return '⚕️';
    case 'foul':
      return e.card === 'red' ? '🟥' : e.card === 'yellow' ? '🟨' : null;
    case 'tactic-shift':
      return '📋';
    case 'scuffle':
      return '💢';
    default:
      return null;
  }
}

function perkNoteOf(e: MatchEvent): string | null {
  if (e.hiddenPerksTriggered.length === 0) return null;
  if (!['goal', 'save', 'blocked'].includes(e.result)) return null;
  for (const perkId of e.hiddenPerksTriggered) {
    const perk = getPerk(perkId);
    if (!perk) continue;
    const ownerId = e.playersInvolved.find((id) => {
      try {
        return getPlayer(id).perks.includes(perkId);
      } catch {
        return false;
      }
    });
    const owner = ownerId ? getPlayer(ownerId).name.split(' ').slice(-1)[0] : null;
    return owner ? `✍ Muhabir notu: “${perk.name}” imzası — ${owner}` : `✍ Muhabir notu: “${perk.name}” imzası`;
  }
  return null;
}

function buildLines(session: MatchSession): FlatLine[] {
  const lines: FlatLine[] = [];
  let score: [number, number] = [0, 0];
  for (const e of session.events) {
    // Büyük gol anonsu "GOOOL" satırına basılır; sonrasındaki kutlama cümlesi
    // küçük bir saha notu olarak düşer (heyecan sırası bozulmaz).
    const goalIdx = e.result === 'goal' ? e.textLines.findIndex((l) => l.includes('GOOOL')) : -1;
    const resultIdx = goalIdx >= 0 ? goalIdx : e.textLines.length - 1;
    e.textLines.forEach((text, i) => {
      const isResult = i === resultIdx;
      const isAftermath = i > resultIdx;
      const isSuspense = !isResult && !isAftermath && i >= resultIdx - 1 && e.textLines.length >= 4;
      if (isResult) score = e.scoreAfterEvent;
      lines.push({
        text,
        minute: e.minute,
        score,
        isGoal: isResult && e.result === 'goal',
        isResult: isResult || isAftermath,
        isSuspense,
        isAftermath,
        icon: isResult ? resultIcon(e, e.textLines.length - 1, e.textLines.length) : e.type === 'faul' && i === 0 ? '⚠️' : null,
        perkNote: i === e.textLines.length - 1 ? perkNoteOf(e) : null,
        side: e.attackingTeam,
        isEventStart: i === 0,
        cue: {
          side: e.attackingTeam,
          eventType: e.type,
          idx: i,
          count: e.textLines.length,
          // Kutlama satırları gol pozunu korur: top ağlarda kalır
          isResult: isResult || isAftermath,
          isGoal: isResult && e.result === 'goal',
          resultKind: isResult || isAftermath ? e.result : null,
          minute: e.minute,
          seq: i,
          pen: isResult || isAftermath ? (e.pen ?? null) : null,
        },
      });
    });
  }
  if (session.penalties) {
    session.penalties.lines.forEach((l, i) => {
      lines.push({
        text: l.text,
        minute: 70,
        score,
        isGoal: l.emphasis === 'goal',
        isResult: l.emphasis === 'goal' || l.emphasis === 'save' || l.emphasis === 'miss',
        isSuspense: l.emphasis === 'suspense',
        icon: l.emphasis === 'goal' ? '⚽' : l.emphasis === 'save' ? '🧤' : l.emphasis === 'miss' ? '💨' : null,
        perkNote: null,
        side: l.side ?? null,
        isEventStart: l.emphasis === 'normal', // her vuruşun ilk satırı
        cue: {
          side: l.side ?? null,
          eventType: 'penalti-seri',
          // Vuruş evresi: normal=yaklaşma, suspense=nokta, sonuç=vuruş
          idx: l.emphasis === 'normal' ? 0 : l.emphasis === 'suspense' ? 1 : 2,
          count: 3,
          isResult: l.emphasis === 'goal' || l.emphasis === 'save' || l.emphasis === 'miss',
          isGoal: l.emphasis === 'goal',
          resultKind: l.emphasis === 'goal' ? 'goal' : l.emphasis === 'save' ? 'save' : l.emphasis === 'miss' ? 'miss' : null,
          minute: 70,
          seq: i,
          pen: l.pen ?? null,
        },
      });
    });
  }
  return lines;
}

/** İmlece kadar TAMAMEN açılmış eventler (timeline/golcü listesi için) */
function revealedEvents(session: MatchSession, cursor: number): MatchEvent[] {
  const out: MatchEvent[] = [];
  let acc = 0;
  for (const e of session.events) {
    acc += e.textLines.length;
    if (acc <= cursor) out.push(e);
    else break;
  }
  return out;
}

const phaseLabels: Record<MatchPhase, string> = {
  H1: 'match.firstHalf',
  H2: 'match.secondHalf',
  ET: 'match.extraTime',
  PENS: 'match.penalties',
};

// ---- Dakika şeridi ----
function Timeline({ events, minute }: { events: MatchEvent[]; minute: number }) {
  const markers = events
    .map((e) => {
      let icon: string | null = null;
      if (e.result === 'goal') icon = '⚽';
      else if (e.card === 'red') icon = '🟥';
      else if (e.card === 'yellow') icon = '🟨';
      else if (e.result === 'injury') icon = '⚕️';
      else if (e.result === 'substitution') icon = '🔁';
      if (!icon) return null;
      return { minute: e.minute, icon, side: e.attackingTeam };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const x = (m: number) => `${(Math.min(m, 70) / 70) * 100}%`;

  return (
    <div className="relative h-10 mt-2">
      {/* çizgi */}
      <div className="absolute left-0 right-0 top-1/2 border-t border-ink/50" />
      {/* devre işaretleri */}
      {[0, 30, 60, 70].map((m) => (
        <div key={m} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: x(m) }}>
          <div className="h-2.5 border-l border-ink/60" />
          <span className="text-[8px] font-score text-ink-faint mt-0.5">{m}'</span>
        </div>
      ))}
      {/* ibre */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-vermil transition-all duration-500"
        style={{ left: x(minute) }}
      />
      {/* olaylar: ev sahibi üstte, rakip altta */}
      {markers.map((m, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 text-[10px] leading-none"
          style={{ left: x(m.minute), top: m.side === 'home' ? '0' : 'auto', bottom: m.side === 'away' ? '0' : 'auto' }}
          title={`${m.minute}'`}
        >
          {m.icon}
        </span>
      ))}
    </div>
  );
}

// ---- Momentum ibresi ----
function Momentum({ events }: { events: MatchEvent[] }) {
  const meaningful = events.filter((e) => !['substitution', 'injury', 'tactic-shift'].includes(e.result)).slice(-3);
  let value = 0; // -1 (rakip) .. +1 (biz)
  for (const e of meaningful) value += e.attackingTeam === 'home' ? 1 / 3 : -1 / 3;
  const pct = 50 + value * 45;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-score uppercase tracking-widest text-ink-faint">{t('match.momentum')}</span>
      <div className="relative w-24 h-1.5 bg-paper-deep border border-ink/30">
        <div className="absolute top-0 bottom-0 w-0.5 bg-ink/30 left-1/2" />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-grass-deep transition-all duration-700"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---- Yardımcı antrenör önerileri (devre arası + kenara talimat ortak bileşen) ----
export function AssistantAdviceCard({ context }: { context: 'HT' | 'LIVE' }) {
  const { session, applyAssistantAction } = useGameStore();
  const [applied, setApplied] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const advice = useMemo(
    () => (session ? getAssistantAdvice(session.sim, session.events) : []),
    // Öneriler panel açıldığı andaki duruma göre bir kez hesaplanır
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  if (!session || advice.length === 0) return null;

  return (
    <div className="border border-ink/30 bg-paper-deep/40 p-3 mb-4">
      <div className="tag-label mb-2">🧢 Yardımcı Antrenör</div>
      {error && <p className="text-xs font-semibold text-vermil mb-1">{error}</p>}
      <div className="space-y-2">
        {advice.map((a, i) => (
          <div key={i} className="flex items-start gap-2">
            <p className="text-[13px] leading-snug italic flex-1">“{a.text}”</p>
            {a.action &&
              (applied.includes(i) ? (
                <span className="text-[11px] font-score uppercase text-grass-deep shrink-0 pt-0.5">✔ Yapıldı</span>
              ) : (
                <button
                  className="btn-press text-[11px] px-2 py-1 shrink-0"
                  onClick={() => {
                    const err = applyAssistantAction(a.action!, context);
                    setError(err);
                    if (!err) setApplied((prev) => [...prev, i]);
                  }}
                >
                  {a.applyLabel ?? 'Uygula'}
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Kenara Talimat paneli ----
function SidelinePanel({ onClose }: { onClose: () => void }) {
  const {
    session,
    makeSubstitution,
    sidelineTacticChange,
    makeInjuryReplacement,
    dismissForcedSub,
    sidelinePositionChange,
  } = useGameStore();
  const [outId, setOutId] = useState<string | null>(null);
  const [style, setStyle] = useState<PlayStyle | null>(null);
  const [posPlayerId, setPosPlayerId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!session) return null;

  const home = session.sim.home;
  const subsLeft = MAX_SUBSTITUTIONS - home.subsUsed;
  const tacticLeft = MAX_INMATCH_TACTIC_CHANGES - session.inMatchTacticChanges;
  const fieldPlayers = home.info.players; // kaleci dahil — GK↔GK değişikliği serbest
  const outPlayer = outId ? fieldPlayers.find((p) => p.id === outId) : null;
  const eligible = outPlayer ? home.info.bench.filter((b) => b.position === outPlayer.position) : [];
  const forcedPos = home.pendingForcedSubPos;
  const benchField = home.info.bench.filter((b) => !isGoalkeeper(b));
  const outfield = fieldPlayers.filter((p): p is FieldPlayer => !isGoalkeeper(p));
  const posPlayer = posPlayerId ? outfield.find((p) => p.id === posPlayerId) : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="news-card max-w-lg w-full p-5 my-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="headline text-lg">{t('match.sideline')}</h3>
          <button className="btn-outline text-xs px-2 py-1" onClick={onClose}>
            {t('match.close')}
          </button>
        </div>
        <p className="text-xs italic text-ink-faint mb-3">{t('match.sidelineNote')}</p>
        {message && <p className="text-xs font-semibold text-vermil mb-2">{message}</p>}

        {/* Zorunlu değişiklik: sakat çıkan oyuncunun yerine isim sokulmalı */}
        {forcedPos && (
          <div className="border-2 border-vermil bg-vermil/10 p-3 mb-4">
            <div className="tag-label text-vermil border-vermil mb-1">⚕ Zorunlu Değişiklik</div>
            <p className="text-xs mb-2">
              Sakatlık sonrası <b>{t(`position.${forcedPos}`)}</b> bölgesi eksik kaldı. Kulübeden bir isim sok
              (farklı mevkiden oyuncu da girebilir) ya da eksik devam et.
            </p>
            {subsLeft > 0 && benchField.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {benchField.map((p) => (
                  <button
                    key={p.id}
                    className={`text-left px-2 py-1 border text-xs hover:bg-grass-deep hover:text-paper ${
                      p.position === forcedPos ? 'border-grass-deep font-semibold' : 'border-ink/30'
                    }`}
                    onClick={() => {
                      const err = makeInjuryReplacement(p.id);
                      setMessage(err);
                    }}
                  >
                    <span className="text-[9px] font-score uppercase opacity-70 mr-1">{t(`position.${p.position}`)}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] italic text-ink-faint mb-2">Değişiklik imkânı yok — eksik devam edilecek.</p>
            )}
            <button className="btn-outline text-[11px] px-2 py-1" onClick={() => dismissForcedSub()}>
              Eksik devam et
            </button>
          </div>
        )}

        <AssistantAdviceCard context="LIVE" />

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="tag-label">{t('halftime.substitutions')}</span>
            <span className="text-[10px] font-score uppercase tracking-wider text-ink-soft">
              {t('halftime.subsLeft', { count: subsLeft })}
            </span>
          </div>
          {subsLeft > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                {fieldPlayers.map((p) => (
                  <button
                    key={p.id}
                    className={`w-full text-left px-2 py-1 border text-xs ${
                      outId === p.id ? 'border-vermil bg-paper font-bold' : 'border-ink/30 hover:border-ink'
                    }`}
                    onClick={() => setOutId(p.id === outId ? null : p.id)}
                  >
                    <span className="text-[9px] font-score uppercase text-ink-faint mr-1">{t(`position.${p.position}`)}</span>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                {outPlayer ? (
                  eligible.length > 0 ? (
                    eligible.map((p) => (
                      <button
                        key={p.id}
                        className="w-full text-left px-2 py-1 border border-grass-deep text-xs hover:bg-grass-deep hover:text-paper"
                        onClick={() => {
                          const err = makeSubstitution(outPlayer.id, p.id);
                          setMessage(err);
                          if (!err) setOutId(null);
                        }}
                      >
                        {p.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-[11px] italic text-ink-faint">Bu pozisyonda uygun yedek yok.</p>
                  )
                ) : (
                  <p className="text-[11px] italic text-ink-faint">{t('halftime.subOut')}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[11px] italic text-ink-faint">Değişiklik hakkı kalmadı.</p>
          )}
        </div>

        {/* Mevki kaydırma: kırmızı sonrası "ortasahacıyı savunmaya çek" müdahalesi */}
        <div className="mb-4">
          <span className="tag-label">Mevki Kaydır</span>
          <p className="text-[11px] italic text-ink-faint mt-0.5 mb-1.5">
            Sahadaki bir oyuncuyu başka bölgeye çek (ör. eksik kalınca orta sahadan savunmaya).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              {outfield.map((p) => (
                <button
                  key={p.id}
                  className={`w-full text-left px-2 py-1 border text-xs ${
                    posPlayerId === p.id ? 'border-vermil bg-paper font-bold' : 'border-ink/30 hover:border-ink'
                  }`}
                  onClick={() => setPosPlayerId(p.id === posPlayerId ? null : p.id)}
                >
                  <span className="text-[9px] font-score uppercase text-ink-faint mr-1">{t(`position.${p.position}`)}</span>
                  {p.name}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              {posPlayer ? (
                (['DEF', 'MID', 'ATK'] as const).map((pos) => (
                  <button
                    key={pos}
                    disabled={posPlayer.position === pos}
                    className="w-full text-left px-2 py-1 border border-grass-deep text-xs hover:bg-grass-deep hover:text-paper disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => {
                      const err = sidelinePositionChange(posPlayer.id, pos);
                      setMessage(err ?? `${posPlayer.name} artık ${t(`position.${pos}`)} bölgesinde oynayacak.`);
                      if (!err) setPosPlayerId(null);
                    }}
                  >
                    → {t(`position.${pos}`)}
                    {posPlayer.position === pos ? ' (şu anki)' : ''}
                  </button>
                ))
              ) : (
                <p className="text-[11px] italic text-ink-faint">Önce oyuncu seç.</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="tag-label">{t('common.playStyle')}</span>
            <span className="text-[10px] font-score uppercase tracking-wider text-ink-soft">
              {t('match.tacticLimitLeft', { count: tacticLeft })}
            </span>
          </div>
          <StylePicker small value={style ?? session.sim.home.info.defaultPlayStyle} onChange={setStyle} />
          <button
            className="btn-press w-full mt-2 text-sm"
            disabled={!style || tacticLeft <= 0}
            onClick={() => {
              if (!style) return;
              const err = sidelineTacticChange(style, null);
              setMessage(err);
              if (!err) setStyle(null);
            }}
          >
            {t('match.applyStyle')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// ---- Ana ekran ----
export function MatchSimulationScreen() {
  const { session, run, advanceReveal, revealAllPhase, produceNext, endPhase } = useGameStore();
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [sidelineOpen, setSidelineOpen] = useState(false);
  const [goalBand, setGoalBand] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const endingRef = useRef(false);
  const processedRef = useRef<number | null>(null);

  const phase = session?.phase ?? 'H1';
  const lines = useMemo(() => (session ? buildLines(session) : []), [session]);
  const cursor = session?.revealCursor ?? 0;
  const visible = lines.slice(0, cursor);
  const done = session ? cursor >= totalLines(session) && session.plannedMinutes.length === 0 : false;

  // Maç saati: dakika dakika ilerler, olaylar dakikası gelince düşer
  const [clock, setClock] = useState(1);
  useEffect(() => {
    endingRef.current = false;
    setClock(PHASE_START[phase]);
  }, [phase]);

  useEffect(() => {
    if (!session || paused || sidelineOpen || phase === 'PENS') return;
    if (clock >= PHASE_END[phase]) return;
    // Sıradaki satır saati bekliyorsa saat akar; olay anındayken saat olayla durur
    const next = lines[cursor];
    const waitingForEvent = next && next.minute <= clock;
    if (waitingForEvent) return;
    const timer = setTimeout(() => setClock((c) => Math.min(c + 1, PHASE_END[phase])), 620 / speed);
    return () => clearTimeout(timer);
  }, [session, clock, cursor, lines, paused, sidelineOpen, speed, phase]);

  // Akış motoru
  useEffect(() => {
    if (!session || paused || sidelineOpen) return;
    if (cursor < lines.length) {
      const next = lines[cursor];
      // Dakikaya göre olay: satır, maç saati o dakikaya gelmeden düşmez
      if (phase !== 'PENS' && next.minute > clock) return;
      let delay = 1400;
      if (next.isSuspense) delay = 1900;
      if (next.isResult) delay = 2100;
      if (next.isGoal) delay = 2300;
      // Seri penaltılar: atmosferli ama sürüklenmeyen tempo
      if (next.cue.eventType === 'penalti-seri') delay *= 1.6;
      const timer = setTimeout(() => advanceReveal(), delay / speed);
      return () => clearTimeout(timer);
    }
    if (session.plannedMinutes.length > 0) {
      const timer = setTimeout(() => produceNext(), 400 / speed);
      return () => clearTimeout(timer);
    }
    // Yarı bitişi: satırlar bitti + saat yarı sonuna ulaştı
    if (phase !== 'PENS' && clock < PHASE_END[phase]) return;
    if (!endingRef.current) {
      endingRef.current = true;
      const timer = setTimeout(() => void endPhase(), 1200);
      return () => {
        // Zamanlayıcı iptal edilirse (duraklat/panel) kilit de açılmalı —
        // yoksa faz sonu bir daha tetiklenmez ve akış donar
        clearTimeout(timer);
        endingRef.current = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, cursor, lines.length, paused, sidelineOpen, speed, clock, phase]);

  // GOOOL bandı
  useEffect(() => {
    const last = visible[visible.length - 1];
    if (last?.isGoal) {
      setGoalBand(last.text);
      const timer = setTimeout(() => setGoalBand(null), 1700);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  // Kırmızı kart / ciddi sakatlık: MAÇ DURUR, söz teknik direktörde
  useEffect(() => {
    if (!session) return;
    const evts = revealedEvents(session, cursor);
    if (processedRef.current === null) {
      // Ekrana dönüşte (devre arası vb.) eski olaylar yeniden tetiklenmesin
      processedRef.current = evts.length;
      return;
    }
    for (let i = processedRef.current; i < evts.length; i++) {
      const e = evts[i];
      if (e.card === 'red' && e.defendingTeam === 'home') {
        setPaused(true);
        setNotice('🟥 Kırmızı kart, eksik kaldık! Dizilişi toparlamak için kenara talimat verebilirsin.');
      }
      if (e.result === 'injury' && e.attackingTeam === 'home' && session.sim.home.pendingForcedSubPos) {
        setPaused(true);
        setSidelineOpen(true);
      }
    }
    processedRef.current = evts.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, session]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [cursor]);

  if (!session || !run) return null;

  const last = visible[visible.length - 1];
  // Gol koreografisi: hazırlık satırlarında top ÖNDEN pozisyon alır (gelen satır),
  // sonuç satırlarında (gol/kurtarış) top METİNLE BİRLİKTE varır ve poz, sonraki
  // satır düşene dek EKRANDA KALIR — spiker "gol" derken top ağlara girer, sahne
  // hemen bir sonraki pozisyona sıçramaz (seri penaltıda vuruş anı görünür kalsın).
  const upcomingLine = lines[cursor];
  const cueLine = last?.isResult ? last : upcomingLine && !upcomingLine.cue.isResult ? upcomingLine : last;
  const score = last?.score ?? [session.sim.home.goals, session.sim.away.goals];
  const minute = phase === 'PENS' ? 70 : Math.max(clock, last?.minute ?? PHASE_START[phase]);
  const revealed = revealedEvents(session, cursor);
  const goals = revealed.filter((e) => e.result === 'goal');

  // Aktif taktikler (skor durumuna göre)
  const homeActive = t(
    `playStyle.${getActiveTactic(session.sim.home.info.tacticalPlan, session.sim.home.goals, session.sim.away.goals)}`,
  );
  const awayActive = t(
    `playStyle.${getActiveTactic(session.sim.away.info.tacticalPlan, session.sim.away.goals, session.sim.home.goals)}`,
  );

  return (
    <div className="max-w-5xl mx-auto relative lg:grid lg:grid-cols-[185px_minmax(0,1fr)_185px] lg:gap-4 lg:items-start">
      {/* PC: sol kadro paneli */}
      <div className="hidden lg:block lg:sticky lg:top-4">
        <RosterPanel state={session.sim.home} side="home" events={revealed} />
      </div>
      <div className="relative">
      {goalBand && (
        <div className="goal-band fixed top-0 left-0 right-0 z-40 bg-vermil text-paper text-center py-3 font-headline font-black text-2xl uppercase tracking-wider shadow-card">
          GOOOL!
        </div>
      )}

      <Scoreboard
        homeName={session.sim.home.info.teamName}
        awayName={session.sim.away.info.teamName}
        score={score as [number, number]}
        minute={minute}
        halfLabel={t(phaseLabels[phase])}
        homeManager={session.sim.home.info.managerName}
        awayManager={session.sim.away.info.managerName}
      />

      {/* Golcüler */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] font-score text-ink-soft">
          <div className="text-right">
            {goals
              .filter((g) => g.attackingTeam === 'home')
              .map((g, i) => (
                <div key={i}>
                  ⚽ {g.minute}' {playerName(g)} {g.setPiece === 'pen' ? '(P)' : g.setPiece === 'fk' ? '(SV)' : ''}
                </div>
              ))}
          </div>
          <div>
            {goals
              .filter((g) => g.attackingTeam === 'away')
              .map((g, i) => (
                <div key={i}>
                  ⚽ {g.minute}' {playerName(g)} {g.setPiece === 'pen' ? '(P)' : g.setPiece === 'fk' ? '(SV)' : ''}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Aktif taktikler */}
      <div className="text-center text-[10px] font-score uppercase tracking-widest text-ink-soft mt-1">
        📋 {homeActive} · {awayActive}
      </div>

      {/* Eksik oyuncu: kırmızı / değişiklik yapılamayan sakatlık */}
      {(session.sim.home.info.players.length < 6 || session.sim.away.info.players.length < 6) && (
        <div className="text-center text-[10px] font-score uppercase tracking-widest text-vermil font-bold mt-0.5">
          {session.sim.home.info.players.length < 6 &&
            `🟥 ${session.sim.home.info.teamName} sahada ${session.sim.home.info.players.length} kişi`}
          {session.sim.home.info.players.length < 6 && session.sim.away.info.players.length < 6 && ' · '}
          {session.sim.away.info.players.length < 6 &&
            `🟥 ${session.sim.away.info.teamName} sahada ${session.sim.away.info.players.length} kişi`}
        </div>
      )}

      {/* Canlı saha: top anlatımla eşzamanlı süzülür */}
      <div className="mt-1">
        <LivePitch home={session.sim.home.info} away={session.sim.away.info} cue={cueLine?.cue ?? null} />
      </div>

      <Timeline events={revealed} minute={minute} />

      {/* Kırmızı kart uyarısı: maç durdu, karar teknik direktörün */}
      {notice && (
        <div className="news-card p-3 mt-2 border-2 border-vermil flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-vermil flex-1 min-w-[180px]">{notice}</span>
          <button
            className="btn-press text-xs px-3 py-1.5"
            onClick={() => {
              setNotice(null);
              setSidelineOpen(true);
            }}
          >
            📣 {t('match.sideline')}
          </button>
          <button
            className="btn-outline text-xs px-3 py-1.5"
            onClick={() => {
              setNotice(null);
              setPaused(false);
            }}
          >
            ▶ {t('match.resume')}
          </button>
        </div>
      )}

      {/* Muhabir sütunu */}
      <div className="news-card mt-2">
        <div className="border-b border-ink/40 px-4 py-2 flex items-center justify-between gap-2">
          <span className="tag-label">{t('match.liveColumn')}</span>
          <Momentum events={revealed} />
        </div>
        <div
          ref={logRef}
          className="px-5 py-4 h-[340px] overflow-y-auto space-y-2.5 cursor-pointer"
          onClick={() => advanceReveal()}
          title="Dokun: sıradaki satır"
        >
          {phase === 'ET' && (
            <p className="headline text-sm text-vermil border-b border-ink/30 pb-2">{t('match.extraTimeIntro')}</p>
          )}
          {phase === 'PENS' && (
            <p className="headline text-sm text-vermil border-b border-ink/30 pb-2">{t('match.penaltiesIntro')}</p>
          )}
          {visible.map((line, i) => (
            <div
              key={i}
              className={`line-in pl-2 border-l-2 ${
                line.side === 'home'
                  ? 'border-grass/60'
                  : line.side === 'away'
                    ? 'border-vermil/50'
                    : 'border-ink/15'
              }`}
            >
              {line.isEventStart && line.side && (
                <span
                  className={`tag-label text-[9px] mb-0.5 inline-block ${
                    line.side === 'home' ? 'text-grass-deep border-grass' : 'text-vermil border-vermil'
                  }`}
                >
                  {line.side === 'home' ? session.sim.home.info.teamName : session.sim.away.info.teamName}
                </span>
              )}
              {line.isGoal ? (
                <div className="goal-pop border-y-4 border-double border-vermil bg-vermil/10 px-3 py-2 my-1 text-center">
                  <p className="goal-headline text-2xl leading-tight">⚽ {line.text}</p>
                </div>
              ) : (
                <p
                  className={`leading-relaxed ${
                    line.cue.eventType === 'taktik' || line.isAftermath
                      ? 'italic text-ink-soft text-[13px]'
                      : line.isSuspense
                        ? 'italic text-ink-soft'
                        : line.isResult
                          ? 'font-semibold text-[15px]'
                          : 'text-[15px]'
                  }`}
                >
                  {line.icon && <span className="mr-1.5">{line.icon}</span>}
                  {line.text}
                </p>
              )}
              {line.perkNote && (
                <p className="text-[11px] italic text-gold border-l-2 border-gold-foil pl-2 mt-0.5">{line.perkNote}</p>
              )}
            </div>
          ))}
          {visible.length === 0 && phase === 'H1' && (
            <p className="italic text-ink-faint">Hakem düdüğü çaldı, top santrada…</p>
          )}
          {done && phase !== 'H1' && (
            <p className="font-headline font-bold text-lg mt-4 border-t border-ink/30 pt-3">
              {session.sim.home.goals === session.sim.away.goals && phase === 'H2'
                ? t('match.extraTimeIntro')
                : session.sim.home.goals === session.sim.away.goals && phase === 'ET'
                  ? t('match.penaltiesIntro')
                  : ''}
            </p>
          )}
        </div>
      </div>

      {/* Yayın kontrolleri */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button className="btn-outline text-xs px-3 py-1.5" onClick={() => setPaused((p) => !p)}>
          {paused ? `▶ ${t('match.resume')}` : `⏸ ${t('match.pause')}`}
        </button>
        <button
          className={`btn-outline text-xs px-3 py-1.5 ${speed === 2 ? 'bg-ink text-paper' : ''}`}
          onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
        >
          {t('match.speed')}: {speed}x
        </button>
        <button
          className="btn-outline text-xs px-3 py-1.5"
          onClick={() => {
            setPaused(true);
            setSidelineOpen(true);
          }}
        >
          📣 {t('match.sideline')}
        </button>
        <button
          className="btn-outline text-xs px-3 py-1.5 ml-auto"
          onClick={() => {
            setClock(PHASE_END[phase]);
            revealAllPhase();
          }}
        >
          ⏩ {t('match.skipHalf')}
        </button>
      </div>

      {/* Mobil: kadrolar log altında */}
      <div className="lg:hidden grid grid-cols-2 gap-2 mt-3">
        <RosterPanel state={session.sim.home} side="home" events={revealed} />
        <RosterPanel state={session.sim.away} side="away" events={revealed} />
      </div>

      {sidelineOpen && (
        <SidelinePanel
          onClose={() => {
            setSidelineOpen(false);
            setPaused(false);
            setNotice(null);
          }}
        />
      )}
      </div>

      {/* PC: sağ kadro paneli */}
      <div className="hidden lg:block lg:sticky lg:top-4">
        <RosterPanel state={session.sim.away} side="away" events={revealed} />
      </div>
    </div>
  );
}

function playerName(e: MatchEvent): string {
  // Gol eventlerinde ilk katılımcı golcüdür — "K. Yıldırım" formatı (isim karışıklığına karşı)
  try {
    const parts = getPlayer(e.playersInvolved[0]).name.split(' ');
    const surname = parts[parts.length - 1];
    return parts.length > 1 ? `${parts[0][0]}. ${surname}` : surname;
  } catch {
    return '';
  }
}
