import type { ChemistryBreakdown } from '../types';
import { t } from '../i18n';

export function ChemistryPanel({ chemistry }: { chemistry: ChemistryBreakdown }) {
  const pct = chemistry.score;
  const barColor = pct >= 80 ? '#2D6A4F' : pct >= 60 ? '#6a8f2d' : pct >= 40 ? '#B08A2E' : '#B3401E';
  return (
    <div className="news-card p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-headline font-bold text-sm uppercase tracking-wide">{t('common.chemistry')}</span>
        <span className="font-score font-bold text-lg">
          {chemistry.score} / 100 <span className="text-xs text-ink-soft">— “{chemistry.description}”</span>
        </span>
      </div>
      <div className="h-2 bg-paper-deep border border-ink/40 mt-1.5">
        <div className="h-full" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <ul className="mt-2 text-xs text-ink-soft space-y-0.5">
        {chemistry.sources.map((s) => (
          <li key={s}>· {s}</li>
        ))}
      </ul>
    </div>
  );
}
