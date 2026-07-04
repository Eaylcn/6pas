import type { Formation } from '../types';

export const formations: Formation[] = [
  {
    id: '2-2-1',
    name: '2-2-1',
    defSlots: 2,
    midSlots: 2,
    atkSlots: 1,
    description: 'Dengeli ve güvenli. Her bölgede kademe var, sürprize kapalı.',
    playStyleAffinity: 'dengeli',
  },
  {
    id: '1-2-2',
    name: '1-2-2',
    defSlots: 1,
    midSlots: 2,
    atkSlots: 2,
    description: 'Hücum ağırlıklı. İki forvet sürekli tehdit, ama arka taraf cesaret ister.',
    playStyleAffinity: 'ofansif',
  },
  {
    id: '1-3-1',
    name: '1-3-1',
    defSlots: 1,
    midSlots: 3,
    atkSlots: 1,
    description: 'Orta saha kontrolü. Topa sahip ol, oyunu pasla boğ.',
    playStyleAffinity: 'dengeli',
  },
  {
    id: '2-1-2',
    name: '2-1-2',
    defSlots: 2,
    midSlots: 1,
    atkSlots: 2,
    description: 'Kontra dostu. Sağlam blok, hızlı çıkış, iki uçta bitirici.',
    playStyleAffinity: 'kontra',
  },
];

export function getFormation(id: string): Formation {
  const f = formations.find((x) => x.id === id);
  if (!f) throw new Error(`Bilinmeyen diziliş: ${id}`);
  return f;
}
