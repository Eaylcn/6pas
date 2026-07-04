import { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchEvent } from '../types';
import { t } from '../i18n';
import { Scoreboard } from '../components/Scoreboard';
import { useGameStore } from '../store/useGameStore';

interface FlatLine {
  text: string;
  minute: number;
  score: [number, number];
  isGoal: boolean;
  isResult: boolean;
  isSuspense: boolean;
}

function flattenEvents(events: MatchEvent[], startScore: [number, number]): FlatLine[] {
  const lines: FlatLine[] = [];
  let score: [number, number] = startScore;
  for (const e of events) {
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
      });
    });
  }
  return lines;
}

export function MatchSimulationScreen() {
  const { session, run, reachHalftime, finishMatch } = useGameStore();
  const isSecondHalf = session?.secondHalfEvents != null;

  const lines = useMemo(() => {
    if (!session) return [];
    if (isSecondHalf) {
      const htScore: [number, number] = session.firstHalfEvents.length
        ? session.firstHalfEvents[session.firstHalfEvents.length - 1].scoreAfterEvent
        : [0, 0];
      return flattenEvents(session.secondHalfEvents!, htScore);
    }
    return flattenEvents(session.firstHalfEvents, [0, 0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isSecondHalf]);

  const [revealed, setRevealed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Yarı değişince sıfırla
  useEffect(() => {
    setRevealed(0);
    setDone(false);
  }, [isSecondHalf]);

  // Hibrit akış: satırlar otomatik düşer; şut anlarında tempo yavaşlar
  useEffect(() => {
    if (paused || done || lines.length === 0) return;
    if (revealed >= lines.length) {
      const timer = setTimeout(() => setDone(true), 1200);
      return () => clearTimeout(timer);
    }
    const next = lines[revealed];
    let delay = 1400;
    if (next.isSuspense) delay = 1900;
    if (next.isResult) delay = 2100;
    if (next.isGoal) delay = 2300;
    const timer = setTimeout(() => setRevealed((r) => r + 1), delay / speed);
    return () => clearTimeout(timer);
  }, [revealed, paused, speed, done, lines]);

  // Yarı bitti → devre arası veya maç sonu
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      if (isSecondHalf) void finishMatch();
      else reachHalftime();
    }, 900);
    return () => clearTimeout(timer);
  }, [done, isSecondHalf, reachHalftime, finishMatch]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [revealed]);

  if (!session || !run) return null;

  const visible = lines.slice(0, revealed);
  const last = visible[visible.length - 1];
  const score = last?.score ?? (isSecondHalf ? lines[0]?.score ?? [0, 0] : [0, 0]);
  const minute = last?.minute ?? (isSecondHalf ? 31 : 1);

  return (
    <div className="max-w-2xl mx-auto">
      <Scoreboard
        homeName={session.home.info.teamName}
        awayName={session.away.info.teamName}
        score={score as [number, number]}
        minute={minute}
        halfLabel={isSecondHalf ? t('match.secondHalf') : t('match.firstHalf')}
      />

      {/* Muhabir sütunu */}
      <div className="news-card mt-4">
        <div className="border-b border-ink/40 px-4 py-2 flex items-center justify-between">
          <span className="tag-label">{t('match.liveColumn')}</span>
          <span className="text-[10px] font-score uppercase tracking-widest text-ink-faint italic">
            {t('match.reporter')}
          </span>
        </div>
        <div ref={logRef} className="px-5 py-4 h-[380px] overflow-y-auto space-y-2.5">
          {visible.map((line, i) => (
            <p
              key={i}
              className={`line-in leading-relaxed ${
                line.isGoal
                  ? 'goal-headline text-2xl py-1'
                  : line.isSuspense
                    ? 'italic text-ink-soft'
                    : 'text-[15px]'
              }`}
            >
              {line.text}
            </p>
          ))}
          {visible.length === 0 && (
            <p className="italic text-ink-faint">Hakem düdüğü çaldı, top santrada…</p>
          )}
          {done && (
            <p className="font-headline font-bold text-lg mt-4 border-t border-ink/30 pt-3">
              {isSecondHalf
                ? session.narration.finalLine(`${session.home.goals} - ${session.away.goals}`)
                : session.narration.halftimeLine(`${session.home.goals} - ${session.away.goals}`)}
            </p>
          )}
        </div>
      </div>

      {/* Yayın kontrolleri */}
      <div className="flex items-center gap-2 mt-3">
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
          className="btn-outline text-xs px-3 py-1.5 ml-auto"
          onClick={() => {
            setRevealed(lines.length);
            setPaused(false);
          }}
        >
          ⏩ {t('match.skipHalf')}
        </button>
      </div>
    </div>
  );
}
