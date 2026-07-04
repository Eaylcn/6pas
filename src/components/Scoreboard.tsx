import { t } from '../i18n';

interface Props {
  homeName: string;
  awayName: string;
  score: [number, number];
  minute: number;
  halfLabel: string;
}

/** Eski tip mekanik skor panosu */
export function Scoreboard({ homeName, awayName, score, minute, halfLabel }: Props) {
  return (
    <div className="news-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-headline font-bold text-sm sm:text-base text-right flex-1 leading-tight">{homeName}</span>
        <div className="flex items-center gap-1 shrink-0">
          <span className="scoreboard-digit text-3xl">{score[0]}</span>
          <span className="font-score font-bold text-xl text-ink-soft">:</span>
          <span className="scoreboard-digit text-3xl">{score[1]}</span>
        </div>
        <span className="font-headline font-bold text-sm sm:text-base text-left flex-1 leading-tight">{awayName}</span>
      </div>
      <div className="flex items-center justify-center gap-3 mt-2 text-[11px] font-score uppercase tracking-widest text-ink-soft">
        <span>{halfLabel}</span>
        <span className="scoreboard-digit text-sm px-1.5">{minute}'</span>
        <span>{t('match.minute')}</span>
      </div>
    </div>
  );
}
