import { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchEvent } from '../types';
import { t } from '../i18n';
import { Scoreboard } from '../components/Scoreboard';
import { phaseOf, useGameStore, type MatchPhase } from '../store/useGameStore';

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

function scoreAfter(events: MatchEvent[], fallback: [number, number]): [number, number] {
  return events.length > 0 ? events[events.length - 1].scoreAfterEvent : fallback;
}

const phaseLabels: Record<MatchPhase, string> = {
  H1: 'match.firstHalf',
  H2: 'match.secondHalf',
  ET: 'match.extraTime',
  PENS: 'match.penalties',
};

export function MatchSimulationScreen() {
  const { session, run, reachHalftime, afterSecondHalf, afterExtraTime, finishMatch } = useGameStore();
  const phase: MatchPhase = session ? phaseOf(session) : 'H1';

  const lines = useMemo<FlatLine[]>(() => {
    if (!session) return [];
    const h1End = scoreAfter(session.firstHalfEvents, [0, 0]);
    switch (phase) {
      case 'H1':
        return flattenEvents(session.firstHalfEvents, [0, 0]);
      case 'H2':
        return flattenEvents(session.secondHalfEvents ?? [], h1End);
      case 'ET': {
        const h2End = scoreAfter(session.secondHalfEvents ?? [], h1End);
        return flattenEvents(session.extraTimeEvents ?? [], h2End);
      }
      case 'PENS': {
        const score: [number, number] = [session.home.goals, session.away.goals];
        return (session.penalties?.lines ?? []).map((l) => ({
          text: l.text,
          minute: 70,
          score,
          isGoal: l.emphasis === 'goal',
          isResult: l.emphasis === 'goal' || l.emphasis === 'save',
          isSuspense: l.emphasis === 'suspense',
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, phase]);

  const [revealed, setRevealed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Faz değişince akışı sıfırla
  useEffect(() => {
    setRevealed(0);
    setDone(false);
  }, [phase]);

  // Hibrit akış: satırlar otomatik düşer; kritik anlarda tempo yavaşlar
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

  // Faz bitti → sıradaki aşama
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      switch (phase) {
        case 'H1':
          reachHalftime();
          break;
        case 'H2':
          void afterSecondHalf();
          break;
        case 'ET':
          void afterExtraTime();
          break;
        case 'PENS':
          void finishMatch();
          break;
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [done, phase, reachHalftime, afterSecondHalf, afterExtraTime, finishMatch]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [revealed]);

  // Faz kapanış satırı (render'da saf kalsın diye memoize)
  const closingLine = useMemo(() => {
    if (!session || !done) return null;
    const score = `${session.home.goals} - ${session.away.goals}`;
    const tied = session.home.goals === session.away.goals;
    switch (phase) {
      case 'H1':
        return session.narration.halftimeLine(score);
      case 'H2':
        return tied ? t('match.extraTimeIntro') : session.narration.finalLine(score);
      case 'ET':
        return tied ? t('match.penaltiesIntro') : session.narration.finalLine(score);
      case 'PENS':
        return null; // kazanan satırı penaltı akışının içinde
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, phase, session]);

  if (!session || !run) return null;

  const visible = lines.slice(0, revealed);
  const last = visible[visible.length - 1];
  const baseScore: [number, number] =
    phase === 'H1' ? [0, 0] : lines[0]?.score ?? [session.home.goals, session.away.goals];
  const score = last?.score ?? baseScore;
  const minute = last?.minute ?? (phase === 'H1' ? 1 : phase === 'H2' ? 31 : phase === 'ET' ? 61 : 70);

  return (
    <div className="max-w-2xl mx-auto">
      <Scoreboard
        homeName={session.home.info.teamName}
        awayName={session.away.info.teamName}
        score={score}
        minute={minute}
        halfLabel={t(phaseLabels[phase])}
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
              {line.text}
            </p>
          ))}
          {visible.length === 0 && phase === 'H1' && (
            <p className="italic text-ink-faint">Hakem düdüğü çaldı, top santrada…</p>
          )}
          {closingLine && (
            <p className="font-headline font-bold text-lg mt-4 border-t border-ink/30 pt-3">{closingLine}</p>
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
