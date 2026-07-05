import { t } from '../i18n';

interface Props {
  homeName: string;
  awayName: string;
  score: [number, number];
  minute: number;
  halfLabel: string;
  homeManager?: string;
  awayManager?: string;
}

/** Eski tip mekanik skor panosu */
export function Scoreboard({ homeName, awayName, score, minute, halfLabel, homeManager, awayManager }: Props) {
  return (
    <div className="news-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-right">
          <div className="font-headline font-bold text-sm sm:text-base leading-tight">{homeName}</div>
          {homeManager && (
            <div className="text-[9px] font-score uppercase tracking-widest text-ink-faint">TD: {homeManager}</div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="scoreboard-digit text-3xl">{score[0]}</span>
          <span className="font-score font-bold text-xl text-ink-soft">:</span>
          <span className="scoreboard-digit text-3xl">{score[1]}</span>
        </div>
        <div className="flex-1 text-left">
          <div className="font-headline font-bold text-sm sm:text-base leading-tight">{awayName}</div>
          {awayManager && (
            <div className="text-[9px] font-score uppercase tracking-widest text-ink-faint">TD: {awayManager}</div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-2 text-[11px] font-score uppercase tracking-widest text-ink-soft">
        <span>{halfLabel}</span>
        <span className="scoreboard-digit text-sm px-1.5">{minute}'</span>
        <span>{t('match.minute')}</span>
      </div>
    </div>
  );
}
