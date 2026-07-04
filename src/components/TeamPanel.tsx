import type { AnyPlayer, TeamMatchInfo } from '../types';
import { isGoalkeeper } from '../types';
import { t } from '../i18n';
import { PlayerCard } from './PlayerCard';

/** Kadro özeti: pozisyona göre gruplu kart listesi */
export function TeamPanel({ team, compact }: { team: TeamMatchInfo; compact?: boolean }) {
  const groups: Array<[string, AnyPlayer[]]> = [
    [t('position.GK'), team.players.filter(isGoalkeeper)],
    [t('position.DEF'), team.players.filter((p) => p.position === 'DEF')],
    [t('position.MID'), team.players.filter((p) => p.position === 'MID')],
    [t('position.ATK'), team.players.filter((p) => p.position === 'ATK')],
  ];

  return (
    <div className="space-y-4">
      {groups.map(([label, players]) =>
        players.length === 0 ? null : (
          <div key={label}>
            <div className="tag-label mb-2">{label}</div>
            <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {players.map((p) => (
                <PlayerCard key={p.id} player={p} isCaptain={p.id === team.captainId} compact={compact} />
              ))}
            </div>
          </div>
        ),
      )}
      {team.bench.length > 0 && (
        <div>
          <div className="tag-label mb-2">{t('common.bench')}</div>
          <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {team.bench.map((p) => (
              <PlayerCard key={p.id} player={p} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
