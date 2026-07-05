import type { AnyPlayer } from '../types';
import { isGoalkeeper } from '../types';
import { getClubName, getLeagueName, getPerk } from '../data';
import { t } from '../i18n';
import { CaptainBadge, IconBadge, PerkBadge, RarityBadge, rarityColor } from './Badges';

interface Props {
  player: AnyPlayer;
  isCaptain?: boolean;
  onClick?: () => void;
  compact?: boolean;
  actionLabel?: string;
  /** Stat değerlerinin altında mini çubuklar (draft aday karşılaştırması) */
  statBars?: boolean;
  /** Bu oyuncu seçilirse takım kimyası kaç puan değişir (draft) */
  chemDelta?: number | null;
  /** İkon kart açılış parlaması */
  revealIcon?: boolean;
  /** Detay görünümü: perk açıklamaları listelenir (inceleme panelleri) */
  detailed?: boolean;
}

/** Stat kısaltmalarının açıklamaları (dokun/üzerine gel) */
const statTitles: Record<string, string> = {
  ATK: 'Hücum: şut, bitiricilik, çalım, savunma arkası koşu',
  ORT: 'Orta saha: pas, oyun kurma, tempo, pres kırma',
  DEF: 'Defans: müdahale, blok, alan kapatma, kademe',
  REF: 'Refleks: yakın mesafe, karşı karşıya, ani kurtarış',
  KOM: 'Komuta: hava topu, korner, ceza sahası hakimiyeti',
  DAĞ: 'Dağıtım: oyun kurma, uzun top, kontra başlatma',
};

export function PlayerCard({
  player,
  isCaptain,
  onClick,
  compact,
  actionLabel,
  statBars,
  chemDelta,
  revealIcon,
  detailed,
}: Props) {
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
  const reveal = revealIcon && player.isIcon ? 'icon-reveal' : '';

  return (
    <div
      className={`${frame} ${clickable} ${reveal} relative p-3 flex flex-col gap-2`}
      style={{ borderLeft: `6px solid ${rarityColor(player.rarity)}` }}
      onClick={onClick}
    >
      {chemDelta != null && (
        <span
          className={`absolute -top-2 right-2 tag-label font-bold ${
            chemDelta > 0 ? 'bg-grass text-paper border-grass' : 'bg-paper-deep'
          }`}
        >
          Kimya {chemDelta > 0 ? `+${chemDelta}` : '±0'}
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {player.isIcon && <IconBadge />}
            {isCaptain && <CaptainBadge />}
          </div>
          <h3 className="font-headline font-bold text-lg leading-tight mt-0.5">{player.name}</h3>
          <div className="text-xs text-ink-soft font-score uppercase tracking-wider">
            {t(`position.${player.position}`)} · {player.nationality}
            {player.age ? ` · ${player.age} yaş` : ''}
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
              <div key={label as string} className="flex-1" title={statTitles[label as string]}>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-score uppercase tracking-widest text-ink-faint border-b border-dotted border-ink/40">
                    {label}
                  </span>
                  <span className="font-score font-bold text-base">{value}</span>
                </div>
                {statBars && (
                  <div className="h-1 bg-paper-deep border border-ink/20 mt-0.5">
                    <div
                      className={`h-full ${(value as number) >= 80 ? 'bg-grass' : (value as number) >= 65 ? 'bg-gold' : 'bg-ink/40'}`}
                      style={{ width: `${Math.min(100, ((value as number) / 99) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
            <div className="ml-auto">
              <RarityBadge rarity={player.rarity} />
            </div>
          </div>

          <div className="text-xs text-ink-soft leading-snug">
            {getClubName(player.club)} — {getLeagueName(player.league)}
          </div>

          {player.perks.length > 0 &&
            (detailed ? (
              <div className="space-y-1 rule-top pt-1.5">
                {player.perks.map((id) => {
                  const perk = getPerk(id);
                  if (!perk) return null;
                  return (
                    <div key={id} className="text-xs">
                      <span className="font-headline font-bold">{perk.name}</span>
                      <span className="text-ink-soft"> — {perk.description}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {player.perks.map((id) => (
                  <PerkBadge key={id} perkId={id} />
                ))}
              </div>
            ))}

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
