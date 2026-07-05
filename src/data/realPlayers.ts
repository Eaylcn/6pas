// Gerçek Yıldızlar Modu kadroları — 2024-25 sezonu esinli, test amaçlı.
// OVR'lar FC tarzı gerçekçi değerlerdir; statlar deterministik türetilir.
import type { FieldPlayer, FieldPosition, Goalkeeper, Rarity } from '../types';
import { createRng } from '../utils/random';
import { perksForPosition } from './perks';

type Pos = FieldPosition | 'GK';
// [isim, pozisyon, ovr, uyruk]
type Row = [string, Pos, number, string];

const squads: Record<string, Row[]> = {
  'ist-falcons': [
    ['Fernando Muslera', 'GK', 82, 'Uruguay'],
    ['Davinson Sánchez', 'DEF', 82, 'Kolombiya'],
    ['Abdülkerim Bardakcı', 'DEF', 78, 'Türkiye'],
    ['Ismail Jakobs', 'DEF', 76, 'Senegal'],
    ['Lucas Torreira', 'MID', 83, 'Uruguay'],
    ['Gabriel Sara', 'MID', 81, 'Brezilya'],
    ['Dries Mertens', 'MID', 80, 'Belçika'],
    ['Victor Osimhen', 'ATK', 88, 'Nijerya'],
    ['Mauro Icardi', 'ATK', 85, 'Arjantin'],
    ['Barış Alper Yılmaz', 'ATK', 79, 'Türkiye'],
  ],
  'ank-meridian': [
    ['Dominik Livaković', 'GK', 82, 'Hırvatistan'],
    ['Çağlar Söyüncü', 'DEF', 79, 'Türkiye'],
    ['Alexander Djiku', 'DEF', 78, 'Gana'],
    ['Bright Osayi-Samuel', 'DEF', 77, 'Nijerya'],
    ['Sebastian Szymański', 'MID', 81, 'Polonya'],
    ['Fred', 'MID', 81, 'Brezilya'],
    ['İrfan Can Kahveci', 'MID', 79, 'Türkiye'],
    ['Edin Džeko', 'ATK', 82, 'Bosna-Hersek'],
    ['Youssef En-Nesyri', 'ATK', 81, 'Fas'],
    ['Dusan Tadić', 'ATK', 82, 'Sırbistan'],
  ],
  'izm-marina': [
    ['Mert Günok', 'GK', 80, 'Türkiye'],
    ['Gabriel Paulista', 'DEF', 78, 'Brezilya'],
    ['Arthur Masuaku', 'DEF', 77, 'DR Kongo'],
    ['Jonas Svensson', 'DEF', 75, 'Norveç'],
    ['Gedson Fernandes', 'MID', 80, 'Portekiz'],
    ['Salih Uçan', 'MID', 74, 'Türkiye'],
    ['Alex Oxlade-Chamberlain', 'MID', 75, 'İngiltere'],
    ['Rafa Silva', 'ATK', 83, 'Portekiz'],
    ['Ciro Immobile', 'ATK', 80, 'İtalya'],
    ['Semih Kılıçsoy', 'ATK', 76, 'Türkiye'],
  ],
  'mad-crown': [
    ['Thibaut Courtois', 'GK', 89, 'Belçika'],
    ['Antonio Rüdiger', 'DEF', 87, 'Almanya'],
    ['Éder Militão', 'DEF', 84, 'Brezilya'],
    ['Dani Carvajal', 'DEF', 86, 'İspanya'],
    ['Jude Bellingham', 'MID', 90, 'İngiltere'],
    ['Federico Valverde', 'MID', 88, 'Uruguay'],
    ['Aurélien Tchouaméni', 'MID', 86, 'Fransa'],
    ['Arda Güler', 'MID', 80, 'Türkiye'],
    ['Kylian Mbappé', 'ATK', 91, 'Fransa'],
    ['Vinícius Júnior', 'ATK', 90, 'Brezilya'],
    ['Rodrygo', 'ATK', 87, 'Brezilya'],
  ],
  'val-sol': [
    ['Jan Oblak', 'GK', 89, 'Slovenya'],
    ['José María Giménez', 'DEF', 84, 'Uruguay'],
    ['Robin Le Normand', 'DEF', 83, 'İspanya'],
    ['Reinildo Mandava', 'DEF', 79, 'Mozambik'],
    ['Koke', 'MID', 82, 'İspanya'],
    ['Rodrigo De Paul', 'MID', 84, 'Arjantin'],
    ['Marcos Llorente', 'MID', 84, 'İspanya'],
    ['Antoine Griezmann', 'ATK', 88, 'Fransa'],
    ['Julián Álvarez', 'ATK', 87, 'Arjantin'],
    ['Alexander Sørloth', 'ATK', 82, 'Norveç'],
  ],
  'sev-roja': [
    ['Marc-André ter Stegen', 'GK', 88, 'Almanya'],
    ['Ronald Araújo', 'DEF', 85, 'Uruguay'],
    ['Jules Koundé', 'DEF', 85, 'Fransa'],
    ['Pau Cubarsí', 'DEF', 82, 'İspanya'],
    ['Pedri', 'MID', 88, 'İspanya'],
    ['Frenkie de Jong', 'MID', 85, 'Hollanda'],
    ['Gavi', 'MID', 83, 'İspanya'],
    ['Lamine Yamal', 'ATK', 89, 'İspanya'],
    ['Robert Lewandowski', 'ATK', 88, 'Polonya'],
    ['Raphinha', 'ATK', 87, 'Brezilya'],
  ],
  'man-forge': [
    ['Ederson', 'GK', 87, 'Brezilya'],
    ['Rúben Dias', 'DEF', 88, 'Portekiz'],
    ['John Stones', 'DEF', 84, 'İngiltere'],
    ['Joško Gvardiol', 'DEF', 85, 'Hırvatistan'],
    ['Rodri', 'MID', 91, 'İspanya'],
    ['Kevin De Bruyne', 'MID', 89, 'Belçika'],
    ['Bernardo Silva', 'MID', 87, 'Portekiz'],
    ['Phil Foden', 'MID', 87, 'İngiltere'],
    ['Erling Haaland', 'ATK', 91, 'Norveç'],
    ['Jack Grealish', 'ATK', 83, 'İngiltere'],
    ['Savinho', 'ATK', 80, 'Brezilya'],
  ],
  'lon-borough': [
    ['David Raya', 'GK', 86, 'İspanya'],
    ['William Saliba', 'DEF', 88, 'Fransa'],
    ['Gabriel Magalhães', 'DEF', 86, 'Brezilya'],
    ['Ben White', 'DEF', 83, 'İngiltere'],
    ['Martin Ødegaard', 'MID', 89, 'Norveç'],
    ['Declan Rice', 'MID', 88, 'İngiltere'],
    ['Kai Havertz', 'MID', 84, 'Almanya'],
    ['Bukayo Saka', 'ATK', 88, 'İngiltere'],
    ['Gabriel Martinelli', 'ATK', 83, 'Brezilya'],
    ['Leandro Trossard', 'ATK', 82, 'Belçika'],
  ],
  'liv-docks': [
    ['Alisson Becker', 'GK', 89, 'Brezilya'],
    ['Virgil van Dijk', 'DEF', 89, 'Hollanda'],
    ['Ibrahima Konaté', 'DEF', 85, 'Fransa'],
    ['Trent Alexander-Arnold', 'DEF', 86, 'İngiltere'],
    ['Andrew Robertson', 'DEF', 84, 'İskoçya'],
    ['Alexis Mac Allister', 'MID', 86, 'Arjantin'],
    ['Dominik Szoboszlai', 'MID', 84, 'Macaristan'],
    ['Ryan Gravenberch', 'MID', 84, 'Hollanda'],
    ['Mohamed Salah', 'ATK', 89, 'Mısır'],
    ['Luis Díaz', 'ATK', 85, 'Kolombiya'],
    ['Cody Gakpo', 'ATK', 83, 'Hollanda'],
  ],
  'mil-vesta': [
    ['Mike Maignan', 'GK', 87, 'Fransa'],
    ['Theo Hernández', 'DEF', 85, 'Fransa'],
    ['Fikayo Tomori', 'DEF', 83, 'İngiltere'],
    ['Strahinja Pavlović', 'DEF', 79, 'Sırbistan'],
    ['Tijjani Reijnders', 'MID', 84, 'Hollanda'],
    ['Youssouf Fofana', 'MID', 81, 'Fransa'],
    ['Ruben Loftus-Cheek', 'MID', 81, 'İngiltere'],
    ['Christian Pulisic', 'ATK', 85, 'ABD'],
    ['Rafael Leão', 'ATK', 86, 'Portekiz'],
    ['Álvaro Morata', 'ATK', 84, 'İspanya'],
  ],
  'rom-aurea': [
    ['Mile Svilar', 'GK', 82, 'Sırbistan'],
    ['Gianluca Mancini', 'DEF', 82, 'İtalya'],
    ['Evan Ndicka', 'DEF', 82, 'Fildişi Sahili'],
    ['Angeliño', 'DEF', 80, 'İspanya'],
    ['Bryan Cristante', 'MID', 80, 'İtalya'],
    ['Lorenzo Pellegrini', 'MID', 82, 'İtalya'],
    ['Manu Koné', 'MID', 79, 'Fransa'],
    ['Paulo Dybala', 'ATK', 86, 'Arjantin'],
    ['Artem Dovbyk', 'ATK', 82, 'Ukrayna'],
    ['Matías Soulé', 'ATK', 78, 'Arjantin'],
  ],
  'tor-nero': [
    ['Michele Di Gregorio', 'GK', 84, 'İtalya'],
    ['Gleison Bremer', 'DEF', 86, 'Brezilya'],
    ['Federico Gatti', 'DEF', 80, 'İtalya'],
    ['Andrea Cambiaso', 'DEF', 82, 'İtalya'],
    ['Manuel Locatelli', 'MID', 82, 'İtalya'],
    ['Teun Koopmeiners', 'MID', 84, 'Hollanda'],
    ['Khéphren Thuram', 'MID', 80, 'Fransa'],
    ['Dušan Vlahović', 'ATK', 84, 'Sırbistan'],
    ['Kenan Yıldız', 'ATK', 80, 'Türkiye'],
    ['Nicolás González', 'ATK', 81, 'Arjantin'],
  ],
  'par-etoile': [
    ['Gianluigi Donnarumma', 'GK', 87, 'İtalya'],
    ['Marquinhos', 'DEF', 86, 'Brezilya'],
    ['Achraf Hakimi', 'DEF', 87, 'Fas'],
    ['Nuno Mendes', 'DEF', 84, 'Portekiz'],
    ['Willian Pacho', 'DEF', 81, 'Ekvador'],
    ['Vitinha', 'MID', 86, 'Portekiz'],
    ['João Neves', 'MID', 84, 'Portekiz'],
    ['Fabián Ruiz', 'MID', 83, 'İspanya'],
    ['Ousmane Dembélé', 'ATK', 88, 'Fransa'],
    ['Khvicha Kvaratskhelia', 'ATK', 88, 'Gürcistan'],
    ['Bradley Barcola', 'ATK', 84, 'Fransa'],
  ],
  'lyo-lumiere': [
    ['Lucas Perri', 'GK', 79, 'Brezilya'],
    ['Duje Ćaleta-Car', 'DEF', 78, 'Hırvatistan'],
    ['Nicolás Tagliafico', 'DEF', 80, 'Arjantin'],
    ['Clinton Mata', 'DEF', 76, 'Angola'],
    ['Corentin Tolisso', 'MID', 79, 'Fransa'],
    ['Nemanja Matić', 'MID', 78, 'Sırbistan'],
    ['Rayan Cherki', 'MID', 81, 'Fransa'],
    ['Alexandre Lacazette', 'ATK', 82, 'Fransa'],
    ['Georges Mikautadze', 'ATK', 80, 'Gürcistan'],
    ['Malick Fofana', 'ATK', 78, 'Belçika'],
  ],
  'mun-adler': [
    ['Manuel Neuer', 'GK', 87, 'Almanya'],
    ['Dayot Upamecano', 'DEF', 84, 'Fransa'],
    ['Kim Min-jae', 'DEF', 84, 'Güney Kore'],
    ['Alphonso Davies', 'DEF', 84, 'Kanada'],
    ['Joshua Kimmich', 'MID', 88, 'Almanya'],
    ['Jamal Musiala', 'MID', 88, 'Almanya'],
    ['Leon Goretzka', 'MID', 82, 'Almanya'],
    ['Michael Olise', 'MID', 85, 'Fransa'],
    ['Harry Kane', 'ATK', 90, 'İngiltere'],
    ['Serge Gnabry', 'ATK', 82, 'Almanya'],
    ['Kingsley Coman', 'ATK', 83, 'Fransa'],
  ],
  'dor-vale': [
    ['Gregor Kobel', 'GK', 87, 'İsviçre'],
    ['Nico Schlotterbeck', 'DEF', 84, 'Almanya'],
    ['Niklas Süle', 'DEF', 81, 'Almanya'],
    ['Julian Ryerson', 'DEF', 78, 'Norveç'],
    ['Marcel Sabitzer', 'MID', 80, 'Avusturya'],
    ['Julian Brandt', 'MID', 83, 'Almanya'],
    ['Felix Nmecha', 'MID', 77, 'Almanya'],
    ['Serhou Guirassy', 'ATK', 85, 'Gine'],
    ['Karim Adeyemi', 'ATK', 81, 'Almanya'],
    ['Jamie Gittens', 'ATK', 79, 'İngiltere'],
  ],
  'ams-noord': [
    ['Remko Pasveer', 'GK', 76, 'Hollanda'],
    ['Jorrel Hato', 'DEF', 79, 'Hollanda'],
    ['Josip Šutalo', 'DEF', 78, 'Hırvatistan'],
    ['Devyne Rensch', 'DEF', 76, 'Hollanda'],
    ['Kenneth Taylor', 'MID', 78, 'Hollanda'],
    ['Davy Klaassen', 'MID', 77, 'Hollanda'],
    ['Jordan Henderson', 'MID', 78, 'İngiltere'],
    ['Brian Brobbey', 'ATK', 79, 'Hollanda'],
    ['Steven Berghuis', 'ATK', 79, 'Hollanda'],
    ['Mika Godts', 'ATK', 74, 'Belçika'],
  ],
  'rot-haven': [
    ['Timon Wellenreuther', 'GK', 78, 'Almanya'],
    ['Gernot Trauner', 'DEF', 78, 'Avusturya'],
    ['Dávid Hancko', 'DEF', 82, 'Slovakya'],
    ['Givairo Read', 'DEF', 74, 'Hollanda'],
    ['Quinten Timber', 'MID', 78, 'Hollanda'],
    ['Calvin Stengs', 'MID', 79, 'Hollanda'],
    ['Jakub Moder', 'MID', 76, 'Polonya'],
    ['Santiago Giménez', 'ATK', 83, 'Meksika'],
    ['Igor Paixão', 'ATK', 80, 'Brezilya'],
    ['Ayase Ueda', 'ATK', 75, 'Japonya'],
  ],
  'por-mare': [
    ['Diogo Costa', 'GK', 86, 'Portekiz'],
    ['Iván Marcano', 'DEF', 76, 'İspanya'],
    ['Nehuén Pérez', 'DEF', 78, 'Arjantin'],
    ['João Mário', 'DEF', 76, 'Portekiz'],
    ['Alan Varela', 'MID', 80, 'Arjantin'],
    ['Stephen Eustáquio', 'MID', 77, 'Kanada'],
    ['Nico González', 'MID', 79, 'İspanya'],
    ['Galeno', 'ATK', 82, 'Brezilya'],
    ['Evanilson', 'ATK', 80, 'Brezilya'],
    ['Pepê', 'ATK', 82, 'Brezilya'],
  ],
  'lis-azul': [
    ['Anatoliy Trubin', 'GK', 82, 'Ukrayna'],
    ['Nicolás Otamendi', 'DEF', 82, 'Arjantin'],
    ['António Silva', 'DEF', 81, 'Portekiz'],
    ['Alexander Bah', 'DEF', 79, 'Danimarka'],
    ['Orkun Kökçü', 'MID', 82, 'Türkiye'],
    ['Fredrik Aursnes', 'MID', 79, 'Norveç'],
    ['Florentino Luís', 'MID', 79, 'Portekiz'],
    ['Ángel Di María', 'ATK', 85, 'Arjantin'],
    ['Kerem Aktürkoğlu', 'ATK', 79, 'Türkiye'],
    ['Vangelis Pavlidis', 'ATK', 81, 'Yunanistan'],
  ],
};

/** Yıldızların imza perkleri — gerisi pozisyona göre deterministik atanır */
const signaturePerks: Record<string, string[]> = {
  'Kylian Mbappé': ['savunma-arkasi', 'tek-dokunus', 'ilk-temas', 'kaleciyle-dans'],
  'Erling Haaland': ['acimasiz-plase', 'kor-nokta-kosusu', 'cift-vurus-sezgisi', 'hava-fisegi'],
  'Vinícius Júnior': ['bilek-kiran', 'dar-aci-ustasi', 'ilk-temas'],
  'Jude Bellingham': ['ikinci-top-avcisi', 'oyunun-nabzi', 'kilit-pas', 'son-vurus'],
  'Rodri': ['saha-akli', 'pas-muhendisi', 'pres-kiran', 'sessiz-orkestra'],
  'Kevin De Bruyne': ['igne-deligi', 'onsezi-pasi', 'kilit-pas', 'ara-koridor'],
  'Harry Kane': ['olu-kose', 'acimasiz-plase', 'onsezi-pasi', 'son-vurus'],
  'Mohamed Salah': ['dar-aci-ustasi', 'savunma-arkasi', 'tek-dokunus', 'kaleciyle-dans'],
  'Virgil van Dijk': ['hava-kilidi', 'son-adam', 'alan-kilidi', 'temas-ustasi'],
  'Lamine Yamal': ['bilek-kiran', 'igne-deligi', 'dar-aci-ustasi'],
  'Robert Lewandowski': ['acimasiz-plase', 'cift-vurus-sezgisi', 'kor-nokta-kosusu'],
  'Pedri': ['dar-alan-ustasi', 'baskidan-cikis', 'sessiz-orkestra', 'tempo-hirsizi'],
  'Martin Ødegaard': ['igne-deligi', 'ucuncu-goz', 'pas-muhendisi'],
  'Bukayo Saka': ['bilek-kiran', 'ters-top', 'dar-aci-ustasi'],
  'Ousmane Dembélé': ['bilek-kiran', 'ilk-temas', 'ters-top'],
  'Khvicha Kvaratskhelia': ['bilek-kiran', 'rabona-imzasi', 'dar-alan-ustasi'],
  'Jan Oblak': ['aci-katili', 'panik-yok', 'direk-dibi', 'karsi-karsiya-sogugu'],
  'Thibaut Courtois': ['ucan-eldiven', 'hava-sahasi', 'aci-katili', 'kale-muhru'],
  'Alisson Becker': ['karsi-karsiya-sogugu', 'ilk-hamle', 'panik-yok', 'kontra-fitili'],
  'Antoine Griezmann': ['tek-dokunus', 'ucuncu-goz', 'son-vurus'],
  'Victor Osimhen': ['hava-fisegi', 'kor-nokta-kosusu', 'savunma-arkasi'],
  'Jamal Musiala': ['dar-alan-ustasi', 'bilek-kiran', 'baskidan-cikis'],
  'Joshua Kimmich': ['pas-muhendisi', 'saha-akli', 'ara-koridor'],
  'Rafael Leão': ['bilek-kiran', 'ilk-temas', 'savunma-arkasi'],
  'Paulo Dybala': ['olu-kose', 'igne-deligi', 'dar-aci-ustasi'],
};

function rarityOf(ovr: number): Rarity {
  if (ovr >= 89) return 'icon';
  if (ovr >= 85) return 'legend';
  if (ovr >= 80) return 'star';
  if (ovr >= 75) return 'pro';
  if (ovr >= 70) return 'solid';
  return 'common';
}

function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const perkCountByRarity: Record<Rarity, number> = { common: 1, solid: 1, pro: 2, star: 2, legend: 3, icon: 4 };

const flavors = [
  'Sahaya çıktığında tribün başka konuşur.',
  'Formasının hakkını her hafta verir.',
  'Büyük maçların adamı.',
  'Hocasının sahadaki uzantısı.',
  'Taraftarın göz bebeği.',
  'İstatistiklere sığmayan bir katkı.',
];

const leagueOfClub: Record<string, string> = {
  'ist-falcons': 'tpc', 'ank-meridian': 'tpc', 'izm-marina': 'tpc',
  'mad-crown': 'icl', 'val-sol': 'icl', 'sev-roja': 'icl',
  'man-forge': 'eml', 'lon-borough': 'eml', 'liv-docks': 'eml',
  'mil-vesta': 'ied', 'rom-aurea': 'ied', 'tor-nero': 'ied',
  'par-etoile': 'fsl', 'lyo-lumiere': 'fsl',
  'mun-adler': 'gpl', 'dor-vale': 'gpl',
  'ams-noord': 'dnl', 'rot-haven': 'dnl',
  'por-mare': 'pcl', 'lis-azul': 'pcl',
};

function buildPlayer(row: Row, clubId: string): FieldPlayer | Goalkeeper {
  const [name, pos, ovr, nationality] = row;
  const rng = createRng(hashOf(name));
  const rarity = rarityOf(ovr);
  const perks =
    signaturePerks[name] ??
    (() => {
      const pool = perksForPosition(pos);
      const count = perkCountByRarity[rarity];
      const picked = new Set<string>();
      let guard = 0;
      while (picked.size < count && guard < 60) {
        picked.add(rng.pick(pool).id);
        guard++;
      }
      return [...picked];
    })();

  const base = {
    id: `rp-${clubId}-${hashOf(name).toString(36)}`,
    name,
    rarity,
    ovr,
    nationality,
    league: leagueOfClub[clubId],
    club: clubId,
    age: 20 + (hashOf(name) % 16),
    perks,
    isIcon: rarity === 'icon',
    flavorText: flavors[hashOf(name) % flavors.length],
    captainTrait:
      pos === 'GK'
        ? 'Ceza sahasında son sözü söyler.'
        : pos === 'DEF'
          ? 'Savunma hattını toparlar.'
          : pos === 'MID'
            ? 'Oyunun temposunu tek başına belirler.'
            : 'Büyük anlarda sorumluluk alır.',
  };

  if (pos === 'GK') {
    const gk: Goalkeeper = {
      ...base,
      position: 'GK',
      ref: ovr + rng.int(-1, 3),
      command: ovr + rng.int(-3, 2),
      distribution: ovr + rng.int(-5, 2),
    };
    return gk;
  }
  const jitter = () => rng.int(-2, 2);
  const stats =
    pos === 'ATK'
      ? { atk: ovr + jitter(), mid: ovr - rng.int(6, 12), def: ovr - rng.int(18, 26) }
      : pos === 'MID'
        ? { atk: ovr - rng.int(8, 14), mid: ovr + jitter(), def: ovr - rng.int(8, 14) }
        : { atk: ovr - rng.int(20, 28), mid: ovr - rng.int(8, 14), def: ovr + jitter() };
  const fp: FieldPlayer = {
    ...base,
    position: pos,
    atk: Math.max(30, stats.atk),
    mid: Math.max(30, stats.mid),
    def: Math.max(30, stats.def),
  };
  return fp;
}

const built = Object.entries(squads).flatMap(([clubId, rows]) => rows.map((r) => buildPlayer(r, clubId)));

export const realFieldPlayers: FieldPlayer[] = built.filter((p): p is FieldPlayer => p.position !== 'GK');
export const realGoalkeepers: Goalkeeper[] = built.filter((p): p is Goalkeeper => p.position === 'GK');
