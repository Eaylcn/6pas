import type { Rarity } from '../types';
import { rarityLabels } from '../utils/formatters';
import { getPerk } from '../data';

const rarityColors: Record<Rarity, string> = {
  common: '#7A7266',
  solid: '#8C6239',
  pro: '#2B547E',
  star: '#7B2D3A',
  legend: '#B08A2E',
  icon: '#D4AF37',
};

export function rarityColor(rarity: Rarity): string {
  return rarityColors[rarity];
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className="tag-label"
      style={{ borderColor: rarityColors[rarity], color: rarityColors[rarity] }}
    >
      {rarityLabels[rarity]}
    </span>
  );
}

export function IconBadge() {
  return (
    <span className="tag-label font-bold" style={{ background: '#D4AF37', color: '#211C16', borderColor: '#B08A2E' }}>
      ★ İKON
    </span>
  );
}

export function CaptainBadge() {
  return (
    <span className="tag-label font-bold bg-ink text-paper" style={{ borderColor: '#211C16' }}>
      Ⓒ KAPTAN
    </span>
  );
}

export function PerkBadge({ perkId }: { perkId: string }) {
  const perk = getPerk(perkId);
  if (!perk) return null;
  return (
    <span className="tag-label bg-paper-deep" title={perk.description}>
      {perk.name}
    </span>
  );
}
