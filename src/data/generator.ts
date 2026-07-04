// Deterministik oyuncu havuzu üretimi — sabit seed ile her derlemede aynı havuz çıkar.
import type { FieldPlayer, FieldPosition, Goalkeeper, Rarity } from '../types';
import { createRng, type Rng } from '../utils/random';
import { clubs } from './clubs';
import { perksForPosition } from './perks';

interface NameBank {
  first: string[];
  last: string[];
  /** Bu uyruğun ağırlıklı oynadığı ligler */
  homeLeagues: string[];
}

const nameBanks: Record<string, NameBank> = {
  Türkiye: {
    first: ['Emir', 'Kaan', 'Baran', 'Mert', 'Arda', 'Yusuf', 'Deniz', 'Berk', 'Onur', 'Umut', 'Serkan', 'Tolga'],
    last: ['Yıldırım', 'Demirok', 'Karahan', 'Aksoy', 'Ergün', 'Taşkın', 'Bozkurt', 'Şener', 'Koçero', 'Ateşli', 'Duranay', 'Kaplan'],
    homeLeagues: ['tpc', 'tpc', 'gpl'],
  },
  Arjantin: {
    first: ['Mateo', 'Thiago', 'Lautaro', 'Julián', 'Nico', 'Franco', 'Santi', 'Emiliano'],
    last: ['Alvarengo', 'Distefano', 'Morelos', 'Pereyra', 'Gaitani', 'Zaballos', 'Correntes', 'Filippo'],
    homeLeagues: ['icl', 'ied', 'fsl'],
  },
  Brezilya: {
    first: ['Cauã', 'Vini', 'Rafinha', 'Gabriel', 'Ederson', 'Luiz', 'Matheus', 'Pedrinho'],
    last: ['dos Anjos', 'Ferrão', 'Batistuto', 'Camarões', 'Silveiro', 'Nazário', 'Oliveto', 'Sousa Prado'],
    homeLeagues: ['pcl', 'icl', 'fsl'],
  },
  Fransa: {
    first: ['Théo', 'Rayan', 'Malik', 'Antoine', 'Jules', 'Enzo', 'Karim', 'Ousmane'],
    last: ['Morel', 'Dupuis', 'Lambert', 'Girard', 'Beaumont', 'Chevalier', 'Rousseau', 'Fontaine'],
    homeLeagues: ['fsl', 'fsl', 'eml'],
  },
  Portekiz: {
    first: ['João', 'Diogo', 'Rúben', 'Tiago', 'Bruno', 'Nuno', 'Gonçalo', 'Rafael'],
    last: ['Cardoveira', 'Almadora', 'Ferristas', 'Moutinello', 'Sequeiros', 'Valadão', 'Pinheira', 'Estrelinha'],
    homeLeagues: ['pcl', 'pcl', 'eml'],
  },
  İspanya: {
    first: ['Pau', 'Iker', 'Álvaro', 'Sergi', 'Dani', 'Marco', 'Adrián', 'Unai'],
    last: ['Cebrián', 'Vallterra', 'Montanés', 'Rodrigál', 'Iborra', 'Zamorano', 'Peralto', 'Escudera'],
    homeLeagues: ['icl', 'icl', 'eml'],
  },
  Almanya: {
    first: ['Lukas', 'Finn', 'Jonas', 'Leon', 'Niklas', 'Timo', 'Moritz', 'Felix'],
    last: ['Brandtner', 'Kellermann', 'Schuster', 'Vogelsang', 'Reinhardt', 'Falkner', 'Steinbach', 'Hartwig'],
    homeLeagues: ['gpl', 'gpl', 'eml'],
  },
  Hollanda: {
    first: ['Daan', 'Sem', 'Jesse', 'Thijs', 'Lars', 'Bram', 'Ruben', 'Koen'],
    last: ['van Dalen', 'de Groot', 'Verhoeven', 'Bakkers', 'van der Meer', 'Sneijders', 'Kuypers', 'Roozen'],
    homeLeagues: ['dnl', 'dnl', 'eml'],
  },
  İngiltere: {
    first: ['Harry', 'Jack', 'Mason', 'Callum', 'Reece', 'Ollie', 'Declan', 'Jordan'],
    last: ['Whitfield', 'Barrow', 'Sterlington', 'Hargreaves', 'Middleton', 'Crowther', 'Ashworth', 'Pemberton'],
    homeLeagues: ['eml', 'eml', 'gpl'],
  },
  İtalya: {
    first: ['Matteo', 'Luca', 'Alessio', 'Davide', 'Federico', 'Nicolò', 'Simone', 'Gianluca'],
    last: ['Bellandi', 'Corvetti', 'Marchisano', 'Fontanella', 'Ruggiero', 'Santarelli', 'Vitalino', 'Draghetti'],
    homeLeagues: ['ied', 'ied', 'fsl'],
  },
  Norveç: {
    first: ['Erling', 'Sander', 'Magnus', 'Oskar', 'Henrik', 'Jorgen'],
    last: ['Bergström', 'Halvorsen', 'Nyland', 'Sorloth', 'Kristofsen', 'Odegard'],
    homeLeagues: ['gpl', 'eml', 'dnl'],
  },
  Mısır: {
    first: ['Omar', 'Karim', 'Tarek', 'Hassan', 'Youssef', 'Amr'],
    last: ['El Shenawy', 'Fathallah', 'Zidanek', 'Mahrouz', 'Sobhi', 'Ghaly'],
    homeLeagues: ['eml', 'fsl', 'icl'],
  },
  Fas: {
    first: ['Ayoub', 'Hakim', 'Sofyan', 'Nabil', 'Ilias', 'Zakaria'],
    last: ['Benhaddou', 'Amrabet', 'El Karouani', 'Bouhaddi', 'Tissoudali', 'Ziyani'],
    homeLeagues: ['fsl', 'dnl', 'icl'],
  },
  Hırvatistan: {
    first: ['Luka', 'Mateo', 'Ivan', 'Marko', 'Ante', 'Bruno'],
    last: ['Kovacevic', 'Brozinić', 'Perišan', 'Vlahović', 'Šimunić', 'Radelić'],
    homeLeagues: ['ied', 'gpl', 'icl'],
  },
  Belçika: {
    first: ['Kevin', 'Thibaut', 'Youri', 'Leandro', 'Axel', 'Dries'],
    last: ['Vermeulen', 'De Winter', 'Casteels', 'Openda', 'Mertens', 'Tielemans'],
    homeLeagues: ['eml', 'gpl', 'fsl'],
  },
  Polonya: {
    first: ['Piotr', 'Krzysztof', 'Wojciech', 'Kamil', 'Arek'],
    last: ['Zielinski', 'Kowalczyk', 'Szczepan', 'Milik', 'Grosicki'],
    homeLeagues: ['gpl', 'ied', 'eml'],
  },
  Uruguay: {
    first: ['Diego', 'Facundo', 'Nahuel', 'Rodrigo', 'Maxi'],
    last: ['Torreiro', 'Cavanato', 'Bentancurt', 'Godinelli', 'Valverdez'],
    homeLeagues: ['icl', 'ied', 'fsl'],
  },
};

const flavorByPosition: Record<FieldPosition | 'GK', string[]> = {
  ATK: [
    'Ceza sahasında nefes almadan düşünür.',
    'Golü kokusundan bulur.',
    'Savunmaların uykusunu kaçırır.',
    'Yarım pozisyonu tam gole çevirir.',
    'Kaleyi gördüğü an gözleri parlar.',
    'Bir anlık boşluk, ona yeter.',
  ],
  MID: [
    'Oyunun metronomu.',
    'Topa dokunduğunda saha genişler.',
    'Pasları hikâye anlatır.',
    'Kalabalıkta bile yalnız oynar.',
    'Tempoyu cebinde taşır.',
    'Sahanın her karışını ezbere bilir.',
  ],
  DEF: [
    'Geçilmesi ruhsata tabi.',
    'Forvetlerin kâbusu.',
    'Sahada sessiz, müdahalede acımasız.',
    'Pozisyonu koklar, tehlikeyi söndürür.',
    'Bölgesinde kuş uçurtmaz.',
    'Her top mücadelesinden alnının akıyla çıkar.',
  ],
  GK: [
    'Kalesi mahalle namusudur.',
    'Çizgide bir kedi.',
    'Eldivenleri hikâye dolu.',
    'Yakın direği kimseye emanet etmez.',
    'Ceza sahasının sessiz patronu.',
    'Refleksleri gençlere ders niteliğinde.',
  ],
};

const captainTraits: Record<FieldPosition | 'GK', string[]> = {
  ATK: ['Takımın hücum ritmini yukarı çeker.', 'Büyük anlarda sorumluluk alır.'],
  MID: ['Oyunun temposunu tek başına belirler.', 'Takımı pasla konuşturur.'],
  DEF: ['Savunma hattını toparlar.', 'Zor anlarda takıma sakinlik aşılar.'],
  GK: ['Ceza sahasında son sözü söyler.', 'Arkadan oyunu okur ve yönetir.'],
};

interface RarityBand {
  rarity: Rarity;
  min: number;
  max: number;
  perkMin: number;
  perkMax: number;
}

export const rarityBands: RarityBand[] = [
  { rarity: 'common', min: 55, max: 65, perkMin: 0, perkMax: 1 },
  { rarity: 'solid', min: 63, max: 72, perkMin: 0, perkMax: 1 },
  { rarity: 'pro', min: 70, max: 79, perkMin: 1, perkMax: 2 },
  { rarity: 'star', min: 78, max: 86, perkMin: 2, perkMax: 3 },
  { rarity: 'legend', min: 85, max: 91, perkMin: 3, perkMax: 4 },
  { rarity: 'icon', min: 90, max: 96, perkMin: 3, perkMax: 4 },
];

function bandOf(rarity: Rarity): RarityBand {
  return rarityBands.find((b) => b.rarity === rarity)!;
}

function pickIdentity(rng: Rng, usedNames: Set<string>) {
  const nations = Object.keys(nameBanks);
  for (let attempt = 0; attempt < 50; attempt++) {
    const nationality = rng.pick(nations);
    const bank = nameBanks[nationality];
    const name = `${rng.pick(bank.first)} ${rng.pick(bank.last)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const leagueId = rng.pick(bank.homeLeagues);
    const clubPool = clubs.filter((c) => c.leagueId === leagueId);
    const club = rng.pick(clubPool);
    return { nationality, name, club };
  }
  throw new Error('İsim havuzu tükendi');
}

function pickPerks(rng: Rng, position: FieldPosition | 'GK', band: RarityBand): string[] {
  const count = rng.int(band.perkMin, band.perkMax);
  if (count === 0) return [];
  const pool = perksForPosition(position);
  const weighted = pool.flatMap((p) => Array(Math.round(p.rarityWeight * 10)).fill(p.id) as string[]);
  const chosen = new Set<string>();
  let guard = 0;
  while (chosen.size < count && guard < 100) {
    chosen.add(rng.pick(weighted));
    guard++;
  }
  return [...chosen];
}

function statSpread(rng: Rng, position: FieldPosition, ovr: number) {
  const jitter = () => rng.int(-2, 2);
  switch (position) {
    case 'ATK':
      return { atk: ovr + jitter(), mid: ovr - rng.int(6, 12), def: ovr - rng.int(18, 26) };
    case 'MID':
      return { atk: ovr - rng.int(8, 14), mid: ovr + jitter(), def: ovr - rng.int(8, 14) };
    case 'DEF':
      return { atk: ovr - rng.int(20, 28), mid: ovr - rng.int(8, 14), def: ovr + jitter() };
  }
}

/** Pozisyon başına üretilecek adetler (icon'lar elle küratörlü, burada yok) */
const fieldCounts: Array<[Rarity, number]> = [
  ['common', 22],
  ['solid', 16],
  ['pro', 13],
  ['star', 8],
  ['legend', 4],
];

const gkCounts: Array<[Rarity, number]> = [
  ['common', 14],
  ['solid', 10],
  ['pro', 8],
  ['star', 6],
  ['legend', 4],
];

export function generateFieldPlayers(seed: number, usedNames: Set<string>): FieldPlayer[] {
  const rng = createRng(seed);
  const players: FieldPlayer[] = [];
  const positions: FieldPosition[] = ['ATK', 'MID', 'DEF'];
  for (const position of positions) {
    for (const [rarity, count] of fieldCounts) {
      const band = bandOf(rarity);
      for (let i = 0; i < count; i++) {
        const { nationality, name, club } = pickIdentity(rng, usedNames);
        const ovr = rng.int(band.min, band.max);
        const stats = statSpread(rng, position, ovr);
        players.push({
          id: `fp-${position.toLowerCase()}-${rarity}-${i}`,
          name,
          position,
          rarity,
          ovr,
          atk: Math.max(30, stats.atk),
          mid: Math.max(30, stats.mid),
          def: Math.max(30, stats.def),
          nationality,
          league: club.leagueId,
          club: club.id,
          perks: pickPerks(rng, position, band),
          isIcon: false,
          flavorText: rng.pick(flavorByPosition[position]),
          captainTrait: rng.pick(captainTraits[position]),
        });
      }
    }
  }
  return players;
}

export function generateGoalkeepers(seed: number, usedNames: Set<string>): Goalkeeper[] {
  const rng = createRng(seed);
  const keepers: Goalkeeper[] = [];
  for (const [rarity, count] of gkCounts) {
    const band = bandOf(rarity);
    for (let i = 0; i < count; i++) {
      const { nationality, name, club } = pickIdentity(rng, usedNames);
      const ovr = rng.int(band.min, band.max);
      keepers.push({
        id: `gk-${rarity}-${i}`,
        name,
        position: 'GK',
        rarity,
        ovr,
        ref: ovr + rng.int(-2, 3),
        command: ovr + rng.int(-4, 2),
        distribution: ovr + rng.int(-6, 2),
        nationality,
        league: club.leagueId,
        club: club.id,
        perks: pickPerks(rng, 'GK', band),
        isIcon: false,
        flavorText: rng.pick(flavorByPosition.GK),
        captainTrait: rng.pick(captainTraits.GK),
      });
    }
  }
  return keepers;
}
