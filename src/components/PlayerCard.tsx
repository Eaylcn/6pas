import type { AnyPlayer } from '../types';
import { isGoalkeeper } from '../types';
import { getClubName, getLeagueName } from '../data';
import { t } from '../i18n';
import { CaptainBadge, IconBadge, PerkBadge, RarityBadge, rarityColor } from './Badges';

interface Props {
  player: AnyPlayer;
  isCaptain?: boolean;
  onClick?: () => void;
  compact?: boolean;
  actionLabel?: string;
}

export function PlayerCard({ player, isCaptain, onClick, compact, actionLabel }: Props) {
  const stats = isGoalkeeper(player)
    ? [
        ['REF', player.ref],
        ['KOM', player.command],
        ['DAĞ', player.distribution],
      ]
    : [
        ['ATK', player.atk],
        ['ORT', player.mid],
        ['DEF', player.def],
      ];

  const frame = player.isIcon ? 'icon-foil' : 'news-card';
  const clickable = onClick ? 'news-card-clickable' : '';

  return (
    <div
      className={`${frame} ${clickable} relative p-3 flex flex-col gap-2`}
      style={{ borderLeft: `6px solid ${rarityColor(player.rarity)}` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {player.isIcon && <IconBadge />}
            {isCaptain && <CaptainBadge />}
          </div>
          <h3 className="font-headline font-bold text-lg leading-tight mt-0.5">{player.name}</h3>
          <div className="text-xs text-ink-soft font-score uppercase tracking-wider">
            {t(`position.${player.position}`)} · {player.nationality}
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="scoreboard-digit text-2xl">{player.ovr}</div>
          <div className="text-[9px] font-score uppercase tracking-widest mt-0.5">OVR</div>
        </div>
      </div>

      {!compact && (
        <>
          <div className="flex gap-3 rule-top pt-1.5">
            {stats.map(([label, value]) => (
              <div key={label as string} className="flex items-baseline gap-1">
                <span className="text-[10px] font-score uppercase tracking-widest text-ink-faint">{label}</span>
                <span className="font-score font-bold text-base">{value}</span>
              </div>
            ))}
            <div className="ml-auto">
              <RarityBadge rarity={player.rarity} />
            </div>
          </div>

          <div className="text-xs text-ink-soft leading-snug">
            {getClubName(player.club)} — {getLeagueName(player.league)}
          </div>

          {player.perks.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {player.perks.map((id) => (
                <PerkBadge key={id} perkId={id} />
              ))}
            </div>
          )}

          <p className="text-xs italic text-ink-faint leading-snug">“{player.flavorText}”</p>
          {isCaptain && player.captainTrait && (
            <p className="text-xs font-semibold text-grass-deep">{player.captainTrait}</p>
          )}
        </>
      )}

      {actionLabel && (
        <div className="mt-1">
          <span className="btn-press text-xs w-full text-center block py-1.5">{actionLabel}</span>
        </div>
      )}
    </div>
  );
}
