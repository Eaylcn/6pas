// Gazete taktik krokisi: kâğıt üzerine mürekkeple çizilmiş halısaha.
// Draft, kadro inceleme, rakip önizleme ve devre arası değişiklikte kullanılır.
import { useMemo, useState } from 'react';
import type { AnyPlayer, Position } from '../types';
import { t } from '../i18n';
import { rarityColor } from './Badges';

export interface PitchSlotView {
  id: string;
  position: Position;
  player: AnyPlayer | null;
  /** Boş slot etiketi (varsayılan: pozisyon adı) */
  label?: string;
}

interface Props {
  slots: PitchSlotView[]; // GK + saha oyuncuları
  bench?: PitchSlotView[];
  captainId?: string | null;
  /** Draft'ta seçili boş slot */
  activeSlotId?: string | null;
  /** Boş slota tıklama (draft) */
  onSlotClick?: (slotId: string) => void;
  /** Dolu jetona tıklama (devre arası seçim vb.) */
  onTokenClick?: (player: AnyPlayer, isBench: boolean) => void;
  /** Kontrollü seçim (verilirse iç seçim devre dışı kalır) */
  selectedPlayerId?: string | null;
  /** Vurgulanacak jetonlar (ör. uygun yedekler) */
  emphasisIds?: Set<string>;
  /** Soluklaştırılacak jetonlar (ör. kırmızı kart) */
  dimmedIds?: Set<string>;
  /** Kimya bağ çizgileri (jeton seçilince) */
  showChemistry?: boolean;
  /** Jeton seçimi değişince (iç seçim modunda) */
  onSelectPlayer?: (player: AnyPlayer | null) => void;
}

interface TokenPos {
  slot: PitchSlotView;
  x: number;
  y: number;
  isBench: boolean;
}

const ROW_Y: Record<'ATK' | 'MID' | 'DEF' | 'GK', number> = { ATK: 30, MID: 62, DEF: 94, GK: 121 };

function surname(name: string): string {
  const parts = name.split(' ');
  const last = parts[parts.length - 1];
  // "K. YILDIRIM" — aynı soyadlı iki oyuncu aynı kişi sanılmasın
  return parts.length > 1 ? `${parts[0][0]}. ${last}` : last;
}

export function PitchView({
  slots,
  bench = [],
  captainId,
  activeSlotId,
  onSlotClick,
  onTokenClick,
  selectedPlayerId,
  emphasisIds,
  dimmedIds,
  showChemistry = true,
  onSelectPlayer,
}: Props) {
  const [innerSelected, setInnerSelected] = useState<string | null>(null);
  const controlled = selectedPlayerId !== undefined;
  const selected = controlled ? selectedPlayerId : innerSelected;

  const hasBench = bench.length > 0;
  const height = hasBench ? 168 : 140;

  const tokens = useMemo<TokenPos[]>(() => {
    const byRow: Record<string, PitchSlotView[]> = { GK: [], DEF: [], MID: [], ATK: [] };
    for (const s of slots) byRow[s.position]?.push(s);
    const result: TokenPos[] = [];
    (['GK', 'DEF', 'MID', 'ATK'] as const).forEach((row) => {
      const rowSlots = byRow[row];
      rowSlots.forEach((slot, i) => {
        result.push({ slot, x: ((i + 1) * 100) / (rowSlots.length + 1), y: ROW_Y[row], isBench: false });
      });
    });
    bench.forEach((slot, i) => {
      result.push({ slot, x: ((i + 1) * 100) / (bench.length + 1), y: 156, isBench: true });
    });
    return result;
  }, [slots, bench]);

  // Kimya bağları: seçili oyuncu ↔ sahadaki takım arkadaşları
  const chemLines = useMemo(() => {
    if (!showChemistry || !selected) return [];
    const from = tokens.find((tk) => tk.slot.player?.id === selected && !tk.isBench);
    if (!from?.slot.player) return [];
    const p = from.slot.player;
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; kind: 'club' | 'league' | 'nation' }> = [];
    for (const tk of tokens) {
      if (tk.isBench || !tk.slot.player || tk.slot.player.id === p.id) continue;
      const q = tk.slot.player;
      if (q.club === p.club) {
        lines.push({ x1: from.x, y1: from.y, x2: tk.x, y2: tk.y, kind: 'club' });
      } else if (q.league === p.league) {
        lines.push({ x1: from.x, y1: from.y, x2: tk.x, y2: tk.y, kind: 'league' });
      }
      if (q.nationality === p.nationality) {
        lines.push({ x1: from.x, y1: from.y, x2: tk.x, y2: tk.y, kind: 'nation' });
      }
    }
    return lines;
  }, [tokens, selected, showChemistry]);

  // Hiç bağı olmayan saha oyuncuları hafif soluk görünür ("kopuk")
  const linklessIds = useMemo(() => {
    const fieldPlayers = tokens.filter((tk) => !tk.isBench && tk.slot.player).map((tk) => tk.slot.player!);
    const ids = new Set<string>();
    for (const p of fieldPlayers) {
      const linked = fieldPlayers.some(
        (q) => q.id !== p.id && (q.club === p.club || q.league === p.league || q.nationality === p.nationality),
      );
      if (!linked) ids.add(p.id);
    }
    return ids;
  }, [tokens]);

  const handleToken = (tk: TokenPos) => {
    const player = tk.slot.player;
    if (!player) {
      onSlotClick?.(tk.slot.id);
      return;
    }
    if (onTokenClick) {
      onTokenClick(player, tk.isBench);
      return;
    }
    if (!controlled) {
      const next = innerSelected === player.id ? null : player.id;
      setInnerSelected(next);
      onSelectPlayer?.(next ? player : null);
    }
  };

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className="w-full max-w-md mx-auto select-none"
      role="img"
      aria-label="Kadro sahası"
    >
      {/* Saha zemini: hafif yeşil baskı yıkaması */}
      <rect x="3" y="3" width="94" height="134" className="fill-grass" opacity="0.08" />
      {/* Saha çizgileri — mürekkep */}
      <g className="stroke-ink" strokeWidth="0.5" fill="none" opacity="0.55">
        <rect x="3" y="3" width="94" height="134" />
        <line x1="3" y1="70" x2="97" y2="70" />
        <circle cx="50" cy="70" r="10" />
        <rect x="28" y="3" width="44" height="13" />
        <rect x="28" y="124" width="44" height="13" />
        <line x1="42" y1="3" x2="58" y2="3" strokeWidth="1.4" />
        <line x1="42" y1="137" x2="58" y2="137" strokeWidth="1.4" />
      </g>

      {/* Kulübe şeridi */}
      {hasBench && (
        <g>
          <line x1="3" y1="146" x2="97" y2="146" className="stroke-ink" strokeWidth="0.4" opacity="0.4" />
          <text x="3" y="143.5" className="fill-ink-faint font-score" fontSize="3.2" letterSpacing="0.6">
            KULÜBE
          </text>
        </g>
      )}

      {/* Kimya bağ çizgileri */}
      <g>
        {chemLines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            className={l.kind === 'club' ? 'stroke-gold-foil' : l.kind === 'league' ? 'stroke-grass' : 'stroke-ink'}
            strokeWidth={l.kind === 'club' ? 1.3 : l.kind === 'league' ? 0.9 : 0.7}
            strokeDasharray={l.kind === 'nation' ? '1.6 1.4' : undefined}
            opacity={l.kind === 'nation' ? 0.75 : 0.9}
          />
        ))}
      </g>

      {/* Jetonlar */}
      {tokens.map((tk) => {
        const { slot, x, y, isBench } = tk;
        const r = isBench ? 6 : 8.5;
        const player = slot.player;
        const clickable = player ? Boolean(onTokenClick) || (!controlled && showChemistry) : Boolean(onSlotClick);
        if (!player) {
          const active = slot.id === activeSlotId;
          return (
            <g
              key={slot.id}
              onClick={() => clickable && handleToken(tk)}
              className={clickable ? 'cursor-pointer' : ''}
            >
              <circle
                cx={x}
                cy={y}
                r={r}
                className={active ? 'stroke-grass-deep fill-paper' : 'stroke-ink fill-paper-soft'}
                strokeWidth={active ? 1.6 : 0.8}
                strokeDasharray="2 1.6"
                opacity={active ? 1 : 0.8}
              />
              <text x={x} y={y + 1.4} textAnchor="middle" className="fill-ink-faint font-score" fontSize="3.4">
                {(slot.label ?? t(`position.${slot.position}`)).toLocaleUpperCase('tr-TR')}
              </text>
              <text x={x} y={y - 2.2} textAnchor="middle" className="fill-ink-faint" fontSize="5">
                +
              </text>
            </g>
          );
        }

        const isSelected = selected === player.id;
        const isCaptain = player.id === captainId;
        const emphasized = emphasisIds?.has(player.id);
        const dimmed = dimmedIds?.has(player.id) || (showChemistry && linklessIds.has(player.id) && !isSelected);
        return (
          <g
            key={slot.id}
            onClick={() => clickable && handleToken(tk)}
            className={clickable ? 'cursor-pointer' : ''}
            opacity={dimmed ? 0.55 : 1}
          >
            {player.isIcon && (
              <circle cx={x} cy={y} r={r + 1.6} fill="none" className="stroke-gold-foil" strokeWidth="0.7" />
            )}
            {(isSelected || emphasized) && (
              <circle
                cx={x}
                cy={y}
                r={r + 2.6}
                fill="none"
                className={emphasized ? 'stroke-grass-deep' : 'stroke-gold-foil'}
                strokeWidth="1"
                strokeDasharray={emphasized ? '2 1.4' : undefined}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={r}
              className="fill-paper-soft"
              stroke={rarityColor(player.rarity)}
              strokeWidth={player.isIcon ? 1.8 : 1.5}
            />
            <text
              x={x}
              y={y + (isBench ? 1.7 : 2)}
              textAnchor="middle"
              className="fill-ink font-score font-bold"
              fontSize={isBench ? 4.6 : 6}
            >
              {player.ovr}
            </text>
            {isCaptain && (
              <g>
                <circle cx={x + r - 1} cy={y - r + 1} r="2.6" className="fill-ink" />
                <text
                  x={x + r - 1}
                  y={y - r + 2.2}
                  textAnchor="middle"
                  className="fill-paper font-score font-bold"
                  fontSize="3.2"
                >
                  C
                </text>
              </g>
            )}
            <text
              x={x}
              y={y + r + 4}
              textAnchor="middle"
              className="fill-ink-soft font-score"
              fontSize={isBench ? 2.9 : 3.3}
              letterSpacing="0.2"
            >
              {surname(player.name).toLocaleUpperCase('tr-TR')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Kimya çizgi lejantı */
export function ChemistryLegend() {
  return (
    <div className="flex items-center gap-3 justify-center text-[10px] font-score uppercase tracking-wider text-ink-soft">
      <span className="flex items-center gap-1">
        <span className="inline-block w-4 h-0.5 bg-gold-foil" /> Kulüp
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-4 h-0.5 bg-grass" /> Lig
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-4 border-t border-dashed border-ink" /> Uyruk
      </span>
    </div>
  );
}
