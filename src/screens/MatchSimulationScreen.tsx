import { useEffect, useMemo, useRef, useState } from 'react';
import type { FieldPlayer, MatchEvent, PlayStyle } from '../types';
import { isGoalkeeper } from '../types';
import { getPlayer } from '../data';
import { t } from '../i18n';
import { Scoreboard } from '../components/Scoreboard';
import { StylePicker } from './TacticsSetupScreen';
import {
  totalLines,
  useGameStore,
  MAX_SUBSTITUTIONS,
  MAX_INMATCH_TACTIC_CHANGES,
  type MatchPhase,
  type MatchSession,
} from '../store/useGameStore';

interface FlatLine {
  text: string;
  minute: number;
  score: [number, number];
  isGoal: boolean;
  isResult: boolean;
  isSuspense: boolean;
  icon: string | null;
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
    default:
      return null;
  }
}

function buildLines(session: MatchSession): FlatLine[] {
  const lines: FlatLine[] = [];
  let score: [number, number] = [0, 0];
  for (const e of session.events) {
    e.textLines.forEach((text, i) => {
      const isLast = i === e.textLines.length - 1;
      const isSuspense = !isLast && i >= e.textLines.length - 2 && e.textLines.length >= 4;
      if (isLast) score = e.scoreAfterEvent;
      lines.push({
        text,
        minute: e.minute,
        score,
        isGoal: isLast && e.result === 'goal',
        isResult: isLast,
        isSuspense,
        icon: resultIcon(e, i, e.textLines.length),
      });
    });
  }
  if (session.penalties) {
    for (const l of session.penalties.lines) {
      lines.push({
        text: l.text,
        minute: 70,
        score,
        isGoal: l.emphasis === 'goal',
        isResult: l.emphasis === 'goal' || l.emphasis === 'save',
        isSuspense: l.emphasis === 'suspense',
        icon: l.emphasis === 'goal' ? '⚽' : l.emphasis === 'save' ? '🧤' : null,
      });
    }
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
  const meaningful = events.filter((e) => !['substitution', 'injury'].includes(e.result)).slice(-3);
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

// ---- Kenara Talimat paneli ----
function SidelinePanel({ onClose }: { onClose: () => void }) {
  const { session, makeSubstitution, sidelineTacticChange } = useGameStore();
  const [outId, setOutId] = useState<string | null>(null);
  const [style, setStyle] = useState<PlayStyle | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!session) return null;

  const home = session.sim.home;
  const subsLeft = MAX_SUBSTITUTIONS - home.subsUsed;
  const tacticLeft = MAX_INMATCH_TACTIC_CHANGES - session.inMatchTacticChanges;
  const fieldPlayers = home.info.players.filter((p): p is FieldPlayer => !isGoalkeeper(p));
  const outPlayer = outId ? fieldPlayers.find((p) => p.id === outId) : null;
  const eligible = outPlayer
    ? home.info.bench.filter((b) => !isGoalkeeper(b) && (b as FieldPlayer).position === outPlayer.position)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="news-card max-w-lg w-full p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="headline text-lg">{t('match.sideline')}</h3>
          <button className="btn-outline text-xs px-2 py-1" onClick={onClose}>
            {t('match.close')}
          </button>
        </div>
        <p className="text-xs italic text-ink-faint mb-3">{t('match.sidelineNote')}</p>
        {message && <p className="text-xs font-semibold text-vermil mb-2">{message}</p>}

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
  );
}

// ---- Ana ekran ----
export function MatchSimulationScreen() {
  const { session, run, advanceReveal, revealAllPhase, produceNext, endPhase } = useGameStore();
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [sidelineOpen, setSidelineOpen] = useState(false);
  const [goalBand, setGoalBand] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const endingRef = useRef(false);

  const phase = session?.phase ?? 'H1';
  const lines = useMemo(() => (session ? buildLines(session) : []), [session]);
  const cursor = session?.revealCursor ?? 0;
  const visible = lines.slice(0, cursor);
  const done = session ? cursor >= totalLines(session) && session.plannedMinutes.length === 0 : false;

  // Faz değişince end kilidi açılır
  useEffect(() => {
    endingRef.current = false;
  }, [phase]);

  // Akış motoru
  useEffect(() => {
    if (!session || paused || sidelineOpen) return;
    if (cursor < lines.length) {
      const next = lines[cursor];
      let delay = 1400;
      if (next.isSuspense) delay = 1900;
      if (next.isResult) delay = 2100;
      if (next.isGoal) delay = 2300;
      const timer = setTimeout(() => advanceReveal(), delay / speed);
      return () => clearTimeout(timer);
    }
    if (session.plannedMinutes.length > 0) {
      const timer = setTimeout(() => produceNext(), 500 / speed);
      return () => clearTimeout(timer);
    }
    if (!endingRef.current) {
      endingRef.current = true;
      const timer = setTimeout(() => void endPhase(), 1400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, cursor, lines.length, paused, sidelineOpen, speed]);

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

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [cursor]);

  if (!session || !run) return null;

  const last = visible[visible.length - 1];
  const score = last?.score ?? [session.sim.home.goals, session.sim.away.goals];
  const minute = last?.minute ?? (phase === 'H1' ? 1 : phase === 'H2' ? 31 : phase === 'ET' ? 61 : 70);
  const revealed = revealedEvents(session, cursor);
  const goals = revealed.filter((e) => e.result === 'goal');

  return (
    <div className="max-w-2xl mx-auto relative">
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

      <Timeline events={revealed} minute={minute} />

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
            <p
              key={i}
              className={`line-in leading-relaxed ${
                line.isGoal
                  ? 'goal-headline text-2xl py-1'
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
        <button className="btn-outline text-xs px-3 py-1.5 ml-auto" onClick={() => revealAllPhase()}>
          ⏩ {t('match.skipHalf')}
        </button>
      </div>

      {sidelineOpen && (
        <SidelinePanel
          onClose={() => {
            setSidelineOpen(false);
            setPaused(false);
          }}
        />
      )}
    </div>
  );
}

function playerName(e: MatchEvent): string {
  // Gol eventlerinde ilk katılımcı golcüdür
  try {
    return getPlayer(e.playersInvolved[0]).name.split(' ').slice(-1)[0];
  } catch {
    return '';
  }
}
