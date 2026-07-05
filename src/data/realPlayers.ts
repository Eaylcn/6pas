// Gerçek Yıldızlar Modu kadroları — 2025-26 sezonu esinli, test amaçlı.
// OVR'lar güncel forma göre gerçekçi değerlerdir; statlar deterministik türetilir.
import type { FieldPlayer, FieldPosition, Goalkeeper, Rarity } from '../types';
import { createRng } from '../utils/random';
import { perksForPosition } from './perks';

type Pos = FieldPosition | 'GK';
// [isim, pozisyon, ovr, uyruk]
type Row = [string, Pos, number, string];

const squads: Record<string, Row[]> = {
  'ist-falcons': [
    ['Uğurcan Çakır', 'GK', 84, 'Türkiye'],
    ['Davinson Sánchez', 'DEF', 84, 'Kolombiya'],
    ['Wilfried Singo', 'DEF', 80, 'Fildişi Sahili'],
    ['Abdülkerim Bardakcı', 'DEF', 79, 'Türkiye'],
    ['İlkay Gündoğan', 'MID', 84, 'Türkiye'],
    ['Lucas Torreira', 'MID', 84, 'Uruguay'],
    ['Gabriel Sara', 'MID', 82, 'Brezilya'],
    ['Victor Osimhen', 'ATK', 90, 'Nijerya'],
    ['Leroy Sané', 'ATK', 82, 'Almanya'],
    ['Barış Alper Yılmaz', 'ATK', 81, 'Türkiye'],
    ['Mauro Icardi', 'ATK', 83, 'Arjantin'],
  ],
  'ank-meridian': [
    ['Ederson', 'GK', 86, 'Brezilya'],
    ['Milan Škriniar', 'DEF', 84, 'Slovakya'],
    ['Nélson Semedo', 'DEF', 79, 'Portekiz'],
    ['Archie Brown', 'DEF', 77, 'İngiltere'],
    ['Marco Asensio', 'MID', 83, 'İspanya'],
    ['Sebastian Szymański', 'MID', 80, 'Polonya'],
    ['İsmail Yüksek', 'MID', 78, 'Türkiye'],
    ['Fred', 'MID', 80, 'Brezilya'],
    ['Youssef En-Nesyri', 'ATK', 82, 'Fas'],
    ['Kerem Aktürkoğlu', 'ATK', 81, 'Türkiye'],
    ['Jhon Durán', 'ATK', 82, 'Kolombiya'],
  ],
  'izm-marina': [
    ['Mert Günok', 'GK', 79, 'Türkiye'],
    ['Gabriel Paulista', 'DEF', 77, 'Brezilya'],
    ['Emirhan Topçu', 'DEF', 76, 'Türkiye'],
    ['Taylan Bulut', 'DEF', 75, 'Türkiye'],
    ['Orkun Kökçü', 'MID', 82, 'Türkiye'],
    ['Wilfred Ndidi', 'MID', 80, 'Nijerya'],
    ['Salih Uçan', 'MID', 74, 'Türkiye'],
    ['Rafa Silva', 'ATK', 83, 'Portekiz'],
    ['Tammy Abraham', 'ATK', 81, 'İngiltere'],
    ['Václav Černý', 'ATK', 79, 'Çekya'],
    ['Cengiz Ünder', 'ATK', 78, 'Türkiye'],
  ],
  'mad-crown': [
    ['Thibaut Courtois', 'GK', 89, 'Belçika'],
    ['Antonio Rüdiger', 'DEF', 86, 'Almanya'],
    ['Trent Alexander-Arnold', 'DEF', 85, 'İngiltere'],
    ['Éder Militão', 'DEF', 84, 'Brezilya'],
    ['Dean Huijsen', 'DEF', 84, 'İspanya'],
    ['Jude Bellingham', 'MID', 90, 'İngiltere'],
    ['Federico Valverde', 'MID', 89, 'Uruguay'],
    ['Aurélien Tchouaméni', 'MID', 86, 'Fransa'],
    ['Arda Güler', 'MID', 83, 'Türkiye'],
    ['Kylian Mbappé', 'ATK', 92, 'Fransa'],
    ['Vinícius Júnior', 'ATK', 90, 'Brezilya'],
    ['Rodrygo', 'ATK', 85, 'Brezilya'],
    ['Franco Mastantuono', 'ATK', 79, 'Arjantin'],
  ],
  'val-sol': [
    ['Jan Oblak', 'GK', 88, 'Slovenya'],
    ['José María Giménez', 'DEF', 83, 'Uruguay'],
    ['Robin Le Normand', 'DEF', 83, 'İspanya'],
    ['Dávid Hancko', 'DEF', 82, 'Slovakya'],
    ['Pablo Barrios', 'MID', 84, 'İspanya'],
    ['Álex Baena', 'MID', 84, 'İspanya'],
    ['Koke', 'MID', 80, 'İspanya'],
    ['Thiago Almada', 'MID', 81, 'Arjantin'],
    ['Julián Álvarez', 'ATK', 89, 'Arjantin'],
    ['Antoine Griezmann', 'ATK', 84, 'Fransa'],
    ['Alexander Sørloth', 'ATK', 82, 'Norveç'],
  ],
  'sev-roja': [
    ['Joan García', 'GK', 85, 'İspanya'],
    ['Jules Koundé', 'DEF', 85, 'Fransa'],
    ['Pau Cubarsí', 'DEF', 84, 'İspanya'],
    ['Ronald Araújo', 'DEF', 84, 'Uruguay'],
    ['Alejandro Balde', 'DEF', 82, 'İspanya'],
    ['Pedri', 'MID', 90, 'İspanya'],
    ['Frenkie de Jong', 'MID', 85, 'Hollanda'],
    ['Dani Olmo', 'MID', 85, 'İspanya'],
    ['Lamine Yamal', 'ATK', 91, 'İspanya'],
    ['Raphinha', 'ATK', 89, 'Brezilya'],
    ['Robert Lewandowski', 'ATK', 87, 'Polonya'],
    ['Marcus Rashford', 'ATK', 82, 'İngiltere'],
  ],
  'man-forge': [
    ['Gianluigi Donnarumma', 'GK', 88, 'İtalya'],
    ['Rúben Dias', 'DEF', 87, 'Portekiz'],
    ['Joško Gvardiol', 'DEF', 86, 'Hırvatistan'],
    ['Rayan Aït-Nouri', 'DEF', 81, 'Cezayir'],
    ['John Stones', 'DEF', 82, 'İngiltere'],
    ['Rodri', 'MID', 90, 'İspanya'],
    ['Bernardo Silva', 'MID', 86, 'Portekiz'],
    ['Phil Foden', 'MID', 85, 'İngiltere'],
    ['Tijjani Reijnders', 'MID', 85, 'Hollanda'],
    ['Rayan Cherki', 'MID', 82, 'Fransa'],
    ['Erling Haaland', 'ATK', 92, 'Norveç'],
    ['Omar Marmoush', 'ATK', 84, 'Mısır'],
    ['Jérémy Doku', 'ATK', 84, 'Belçika'],
  ],
  'lon-borough': [
    ['David Raya', 'GK', 87, 'İspanya'],
    ['William Saliba', 'DEF', 88, 'Fransa'],
    ['Gabriel Magalhães', 'DEF', 87, 'Brezilya'],
    ['Jurriën Timber', 'DEF', 84, 'Hollanda'],
    ['Riccardo Calafiori', 'DEF', 82, 'İtalya'],
    ['Declan Rice', 'MID', 89, 'İngiltere'],
    ['Martin Ødegaard', 'MID', 88, 'Norveç'],
    ['Martín Zubimendi', 'MID', 85, 'İspanya'],
    ['Eberechi Eze', 'MID', 83, 'İngiltere'],
    ['Bukayo Saka', 'ATK', 89, 'İngiltere'],
    ['Viktor Gyökeres', 'ATK', 86, 'İsveç'],
    ['Gabriel Martinelli', 'ATK', 83, 'Brezilya'],
  ],
  'liv-docks': [
    ['Alisson Becker', 'GK', 88, 'Brezilya'],
    ['Virgil van Dijk', 'DEF', 89, 'Hollanda'],
    ['Ibrahima Konaté', 'DEF', 86, 'Fransa'],
    ['Jeremie Frimpong', 'DEF', 82, 'Hollanda'],
    ['Milos Kerkez', 'DEF', 81, 'Macaristan'],
    ['Alexis Mac Allister', 'MID', 87, 'Arjantin'],
    ['Florian Wirtz', 'MID', 89, 'Almanya'],
    ['Ryan Gravenberch', 'MID', 86, 'Hollanda'],
    ['Dominik Szoboszlai', 'MID', 85, 'Macaristan'],
    ['Mohamed Salah', 'ATK', 90, 'Mısır'],
    ['Alexander Isak', 'ATK', 89, 'İsveç'],
    ['Cody Gakpo', 'ATK', 84, 'Hollanda'],
    ['Hugo Ekitike', 'ATK', 83, 'Fransa'],
  ],
  'mil-vesta': [
    ['Mike Maignan', 'GK', 87, 'Fransa'],
    ['Fikayo Tomori', 'DEF', 83, 'İngiltere'],
    ['Strahinja Pavlović', 'DEF', 81, 'Sırbistan'],
    ['Matteo Gabbia', 'DEF', 79, 'İtalya'],
    ['Luka Modrić', 'MID', 84, 'Hırvatistan'],
    ['Adrien Rabiot', 'MID', 83, 'Fransa'],
    ['Youssouf Fofana', 'MID', 81, 'Fransa'],
    ['Christian Pulisic', 'ATK', 86, 'ABD'],
    ['Rafael Leão', 'ATK', 87, 'Portekiz'],
    ['Santiago Giménez', 'ATK', 81, 'Meksika'],
    ['Christopher Nkunku', 'ATK', 82, 'Fransa'],
  ],
  'rom-aurea': [
    ['Mile Svilar', 'GK', 85, 'Sırbistan'],
    ['Evan Ndicka', 'DEF', 83, 'Fildişi Sahili'],
    ['Gianluca Mancini', 'DEF', 82, 'İtalya'],
    ['Zeki Çelik', 'DEF', 79, 'Türkiye'],
    ['Wesley', 'DEF', 78, 'Brezilya'],
    ['Manu Koné', 'MID', 82, 'Fransa'],
    ['Bryan Cristante', 'MID', 80, 'İtalya'],
    ['Lorenzo Pellegrini', 'MID', 80, 'İtalya'],
    ['Paulo Dybala', 'ATK', 84, 'Arjantin'],
    ['Artem Dovbyk', 'ATK', 81, 'Ukrayna'],
    ['Matías Soulé', 'ATK', 80, 'Arjantin'],
    ['Evan Ferguson', 'ATK', 78, 'İrlanda'],
  ],
  'tor-nero': [
    ['Michele Di Gregorio', 'GK', 85, 'İtalya'],
    ['Gleison Bremer', 'DEF', 85, 'Brezilya'],
    ['Andrea Cambiaso', 'DEF', 82, 'İtalya'],
    ['Pierre Kalulu', 'DEF', 81, 'Fransa'],
    ['Federico Gatti', 'DEF', 81, 'İtalya'],
    ['Manuel Locatelli', 'MID', 82, 'İtalya'],
    ['Teun Koopmeiners', 'MID', 82, 'Hollanda'],
    ['Khéphren Thuram', 'MID', 82, 'Fransa'],
    ['Kenan Yıldız', 'ATK', 85, 'Türkiye'],
    ['Jonathan David', 'ATK', 83, 'Kanada'],
    ['Dušan Vlahović', 'ATK', 83, 'Sırbistan'],
    ['Loïs Openda', 'ATK', 81, 'Belçika'],
  ],
  'par-etoile': [
    ['Lucas Chevalier', 'GK', 84, 'Fransa'],
    ['Achraf Hakimi', 'DEF', 89, 'Fas'],
    ['Nuno Mendes', 'DEF', 87, 'Portekiz'],
    ['Marquinhos', 'DEF', 85, 'Brezilya'],
    ['Willian Pacho', 'DEF', 84, 'Ekvador'],
    ['Vitinha', 'MID', 89, 'Portekiz'],
    ['João Neves', 'MID', 87, 'Portekiz'],
    ['Fabián Ruiz', 'MID', 85, 'İspanya'],
    ['Warren Zaïre-Emery', 'MID', 82, 'Fransa'],
    ['Ousmane Dembélé', 'ATK', 91, 'Fransa'],
    ['Khvicha Kvaratskhelia', 'ATK', 88, 'Gürcistan'],
    ['Désiré Doué', 'ATK', 86, 'Fransa'],
    ['Bradley Barcola', 'ATK', 84, 'Fransa'],
  ],
  'lyo-lumiere': [
    ['Dominik Greif', 'GK', 78, 'Slovakya'],
    ['Moussa Niakhaté', 'DEF', 79, 'Senegal'],
    ['Nicolás Tagliafico', 'DEF', 79, 'Arjantin'],
    ['Clinton Mata', 'DEF', 75, 'Angola'],
    ['Corentin Tolisso', 'MID', 80, 'Fransa'],
    ['Pavel Šulc', 'MID', 78, 'Çekya'],
    ['Tanner Tessmann', 'MID', 77, 'ABD'],
    ['Tyler Morton', 'MID', 76, 'İngiltere'],
    ['Malick Fofana', 'ATK', 81, 'Belçika'],
    ['Martín Satriano', 'ATK', 75, 'Uruguay'],
    ['Enzo Molebe', 'ATK', 72, 'Fransa'],
  ],
  'mun-adler': [
    ['Manuel Neuer', 'GK', 86, 'Almanya'],
    ['Jonathan Tah', 'DEF', 85, 'Almanya'],
    ['Dayot Upamecano', 'DEF', 85, 'Fransa'],
    ['Kim Min-jae', 'DEF', 83, 'Güney Kore'],
    ['Alphonso Davies', 'DEF', 83, 'Kanada'],
    ['Joshua Kimmich', 'MID', 88, 'Almanya'],
    ['Jamal Musiala', 'MID', 89, 'Almanya'],
    ['Michael Olise', 'MID', 87, 'Fransa'],
    ['Leon Goretzka', 'MID', 81, 'Almanya'],
    ['Harry Kane', 'ATK', 91, 'İngiltere'],
    ['Luis Díaz', 'ATK', 86, 'Kolombiya'],
    ['Nicolas Jackson', 'ATK', 80, 'Senegal'],
  ],
  'dor-vale': [
    ['Gregor Kobel', 'GK', 87, 'İsviçre'],
    ['Nico Schlotterbeck', 'DEF', 85, 'Almanya'],
    ['Waldemar Anton', 'DEF', 80, 'Almanya'],
    ['Niklas Süle', 'DEF', 80, 'Almanya'],
    ['Julian Ryerson', 'DEF', 78, 'Norveç'],
    ['Julian Brandt', 'MID', 82, 'Almanya'],
    ['Pascal Groß', 'MID', 79, 'Almanya'],
    ['Marcel Sabitzer', 'MID', 79, 'Avusturya'],
    ['Jobe Bellingham', 'MID', 78, 'İngiltere'],
    ['Serhou Guirassy', 'ATK', 87, 'Gine'],
    ['Karim Adeyemi', 'ATK', 82, 'Almanya'],
    ['Maximilian Beier', 'ATK', 80, 'Almanya'],
  ],
  'ams-noord': [
    ['Remko Pasveer', 'GK', 75, 'Hollanda'],
    ['Ko Itakura', 'DEF', 79, 'Japonya'],
    ['Josip Šutalo', 'DEF', 78, 'Hırvatistan'],
    ['Youri Baas', 'DEF', 77, 'Hollanda'],
    ['Kenneth Taylor', 'MID', 79, 'Hollanda'],
    ['Davy Klaassen', 'MID', 76, 'Hollanda'],
    ['Youri Regeer', 'MID', 75, 'Hollanda'],
    ['Kasper Dolberg', 'ATK', 79, 'Danimarka'],
    ['Steven Berghuis', 'ATK', 78, 'Hollanda'],
    ['Mika Godts', 'ATK', 77, 'Belçika'],
    ['Wout Weghorst', 'ATK', 78, 'Hollanda'],
  ],
  'rot-haven': [
    ['Timon Wellenreuther', 'GK', 79, 'Almanya'],
    ['Anel Ahmedhodžić', 'DEF', 78, 'Bosna-Hersek'],
    ['Tsuyoshi Watanabe', 'DEF', 78, 'Japonya'],
    ['Gernot Trauner', 'DEF', 77, 'Avusturya'],
    ['Sem Steijn', 'MID', 80, 'Hollanda'],
    ['Quinten Timber', 'MID', 79, 'Hollanda'],
    ['Jakub Moder', 'MID', 76, 'Polonya'],
    ['Luciano Valente', 'MID', 76, 'Hollanda'],
    ['Ayase Ueda', 'ATK', 79, 'Japonya'],
    ['Anis Hadj Moussa', 'ATK', 78, 'Cezayir'],
    ['Gonçalo Borges', 'ATK', 76, 'Portekiz'],
  ],
  'por-mare': [
    ['Diogo Costa', 'GK', 86, 'Portekiz'],
    ['Jan Bednarek', 'DEF', 79, 'Polonya'],
    ['Zé Pedro', 'DEF', 76, 'Portekiz'],
    ['Iván Marcano', 'DEF', 74, 'İspanya'],
    ['Alan Varela', 'MID', 82, 'Arjantin'],
    ['Gabri Veiga', 'MID', 79, 'İspanya'],
    ['Victor Froholdt', 'MID', 78, 'Danimarka'],
    ['Stephen Eustáquio', 'MID', 78, 'Kanada'],
    ['Samu Aghehowa', 'ATK', 83, 'İspanya'],
    ['Pepê', 'ATK', 82, 'Brezilya'],
    ['Rodrigo Mora', 'ATK', 80, 'Portekiz'],
    ['Luuk de Jong', 'ATK', 76, 'Hollanda'],
  ],
  'lis-azul': [
    ['Anatoliy Trubin', 'GK', 84, 'Ukrayna'],
    ['António Silva', 'DEF', 82, 'Portekiz'],
    ['Nicolás Otamendi', 'DEF', 81, 'Arjantin'],
    ['Alexander Bah', 'DEF', 78, 'Danimarka'],
    ['Samuel Dahl', 'DEF', 76, 'İsveç'],
    ['Georgiy Sudakov', 'MID', 83, 'Ukrayna'],
    ['Richard Ríos', 'MID', 80, 'Kolombiya'],
    ['Fredrik Aursnes', 'MID', 79, 'Norveç'],
    ['Enzo Barrenechea', 'MID', 77, 'Arjantin'],
    ['Vangelis Pavlidis', 'ATK', 83, 'Yunanistan'],
    ['Franjo Ivanović', 'ATK', 79, 'Hırvatistan'],
    ['Andreas Schjelderup', 'ATK', 76, 'Norveç'],
  ],
};

/** Yıldızların imza perkleri — gerisi pozisyona göre deterministik atanır */
const signaturePerks: Record<string, string[]> = {
  'Kylian Mbappé': ['savunma-arkasi', 'tek-dokunus', 'ilk-temas', 'kaleciyle-dans'],
  'Erling Haaland': ['acimasiz-plase', 'kor-nokta-kosusu', 'cift-vurus-sezgisi', 'hava-fisegi'],
  'Vinícius Júnior': ['bilek-kiran', 'dar-aci-ustasi', 'ilk-temas'],
  'Jude Bellingham': ['ikinci-top-avcisi', 'oyunun-nabzi', 'kilit-pas', 'son-vurus'],
  'Rodri': ['saha-akli', 'pas-muhendisi', 'pres-kiran', 'sessiz-orkestra'],
  'Harry Kane': ['olu-kose', 'acimasiz-plase', 'onsezi-pasi', 'son-vurus'],
  'Mohamed Salah': ['dar-aci-ustasi', 'savunma-arkasi', 'tek-dokunus', 'kaleciyle-dans'],
  'Virgil van Dijk': ['hava-kilidi', 'son-adam', 'alan-kilidi', 'temas-ustasi'],
  'Lamine Yamal': ['bilek-kiran', 'igne-deligi', 'dar-aci-ustasi', 'rabona-imzasi'],
  'Robert Lewandowski': ['acimasiz-plase', 'cift-vurus-sezgisi', 'kor-nokta-kosusu'],
  'Pedri': ['dar-alan-ustasi', 'baskidan-cikis', 'sessiz-orkestra', 'tempo-hirsizi'],
  'Martin Ødegaard': ['igne-deligi', 'ucuncu-goz', 'pas-muhendisi'],
  'Bukayo Saka': ['bilek-kiran', 'ters-top', 'dar-aci-ustasi'],
  'Ousmane Dembélé': ['bilek-kiran', 'ilk-temas', 'ters-top', 'cift-vurus-sezgisi'],
  'Khvicha Kvaratskhelia': ['bilek-kiran', 'rabona-imzasi', 'dar-alan-ustasi'],
  'Jan Oblak': ['aci-katili', 'panik-yok', 'direk-dibi', 'karsi-karsiya-sogugu'],
  'Thibaut Courtois': ['ucan-eldiven', 'hava-sahasi', 'aci-katili', 'kale-muhru'],
  'Alisson Becker': ['karsi-karsiya-sogugu', 'ilk-hamle', 'panik-yok', 'kontra-fitili'],
  'Gianluigi Donnarumma': ['ucan-eldiven', 'tek-el-mucizesi', 'panik-yok', 'aci-katili'],
  'Antoine Griezmann': ['tek-dokunus', 'ucuncu-goz', 'son-vurus'],
  'Victor Osimhen': ['hava-fisegi', 'kor-nokta-kosusu', 'savunma-arkasi', 'ilk-temas'],
  'Jamal Musiala': ['dar-alan-ustasi', 'bilek-kiran', 'baskidan-cikis'],
  'Joshua Kimmich': ['pas-muhendisi', 'saha-akli', 'ara-koridor'],
  'Rafael Leão': ['bilek-kiran', 'ilk-temas', 'savunma-arkasi'],
  'Paulo Dybala': ['olu-kose', 'igne-deligi', 'dar-aci-ustasi'],
  'Florian Wirtz': ['igne-deligi', 'dar-alan-ustasi', 'onsezi-pasi', 'ucuncu-goz'],
  'Alexander Isak': ['tek-dokunus', 'kaleciyle-dans', 'acimasiz-plase'],
  'Viktor Gyökeres': ['acimasiz-plase', 'kor-nokta-kosusu', 'savunma-arkasi'],
  'Vitinha': ['saha-akli', 'pas-muhendisi', 'baskidan-cikis', 'sessiz-orkestra'],
  'İlkay Gündoğan': ['sessiz-orkestra', 'saha-akli', 'kilit-pas'],
  'Kenan Yıldız': ['bilek-kiran', 'dar-alan-ustasi', 'olu-kose'],
  'Achraf Hakimi': ['savunma-arkasi', 'ters-kademe', 'ilk-temas'],
  'Declan Rice': ['pres-kiran', 'ikinci-top-avcisi', 'duvar-etkisi'],
  'William Saliba': ['son-adam', 'sessiz-mudahale', 'temas-ustasi'],
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
