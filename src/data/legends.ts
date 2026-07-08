// ⭐ İKON KATMANI: Gerçek efsane (emekli) futbolcular.
// Draft'ta en nadir kademe (%2); efsane kulüplerine bağlı oldukları için
// güncel kadro oyuncularıyla kulüp kimyası kurabilirler (ör. Maldini + bugünkü Milan).
import type { FieldPlayer, Goalkeeper } from '../types';

type FRow = [
  name: string,
  pos: 'ATK' | 'MID' | 'DEF',
  ovr: number,
  atk: number,
  mid: number,
  def: number,
  nat: string,
  club: string,
  age: number,
  perks: [string, string],
  flavor: string,
];

const leagueOfClub: Record<string, string> = {
  'ist-falcons': 'tpc', 'ank-meridian': 'tpc', 'izm-marina': 'tpc', 'trb-bordo': 'tpc',
  'mad-crown': 'icl', 'sev-roja': 'icl',
  'man-forge': 'eml', 'lon-borough': 'eml', 'liv-docks': 'eml', 'lon-blues': 'eml', 'man-reds': 'eml',
  'mil-vesta': 'ied', 'rom-aurea': 'ied', 'tor-nero': 'ied', 'mil-serpenti': 'ied', 'nap-vulcano': 'ied',
  'par-etoile': 'fsl', 'mar-azur': 'fsl',
  'mun-adler': 'gpl', 'lev-fabrik': 'gpl',
  'ams-noord': 'dnl',
  'por-mare': 'pcl', 'lis-azul': 'pcl', 'lis-leao': 'pcl',
};

const fieldRows: FRow[] = [
  // ---- ATAK ----
  ['Diego Maradona', 'ATK', 97, 97, 93, 45, 'Arjantin', 'nap-vulcano', 27, ['bilek-kiran', 'kaleciyle-dans'], 'Top ayağındayken fizik kuralları tavsiyeye dönüşür.'],
  ['Ronaldo Nazário', 'ATK', 96, 97, 84, 40, 'Brezilya', 'mil-serpenti', 24, ['tek-dokunus', 'kaleciyle-dans'], 'Kalecilerin kâbuslarında hâlâ o çalım vardır.'],
  ['Ronaldinho', 'ATK', 95, 94, 92, 42, 'Brezilya', 'sev-roja', 26, ['bilek-kiran', 'igne-deligi'], 'Futbolu gülümseyerek oynayan adam.'],
  ['Thierry Henry', 'ATK', 94, 95, 85, 45, 'Fransa', 'lon-borough', 27, ['savunma-arkasi', 'acimasiz-plase'], 'Va va voom — çizgiden içeri kesip köşeyi bulur.'],
  ['Eusébio', 'ATK', 94, 95, 82, 44, 'Portekiz', 'lis-azul', 25, ['kor-nokta-kosusu', 'olu-kose'], 'Kara Panter; şutu gongdan hızlı.'],
  ['Francesco Totti', 'ATK', 94, 92, 93, 48, 'İtalya', 'rom-aurea', 28, ['onsezi-pasi', 'acimasiz-plase'], "Roma'nın sekizinci kralı; kaşıkla servis yapar."],
  ['Alessandro Del Piero', 'ATK', 93, 93, 88, 44, 'İtalya', 'tor-nero', 27, ['dar-aci-ustasi', 'olu-kose'], 'Del Piero bölgesi diye bir yer vardır; oradan af çıkmaz.'],
  ['Didier Drogba', 'ATK', 92, 93, 80, 55, 'Fildişi Sahili', 'lon-blues', 29, ['hava-fisegi', 'son-vurus'], 'Büyük maç adamı; final demek Drogba demek.'],
  // ---- ORTA SAHA ----
  ['Zinedine Zidane', 'MID', 96, 90, 97, 60, 'Fransa', 'mad-crown', 28, ['sessiz-orkestra', 'dar-alan-ustasi'], 'Topa dokunduğunda stadyum susar; ruble dönerken zaman durur.'],
  ['Xavi Hernández', 'MID', 94, 78, 96, 62, 'İspanya', 'sev-roja', 29, ['pas-muhendisi', 'saha-akli'], 'Bir saniye önünü, iki saniye sonrasını görür.'],
  ['Andrés Iniesta', 'MID', 94, 82, 96, 58, 'İspanya', 'sev-roja', 28, ['igne-deligi', 'dar-alan-ustasi'], 'Kalabalığın içinde yürüyüşe çıkmış gibi oynar.'],
  ['Kaká', 'MID', 94, 91, 93, 52, 'Brezilya', 'mil-vesta', 25, ['baskidan-cikis', 'kilit-pas'], 'Orta sahadan kaleye üç saniyede varan ekspres.'],
  ['Andrea Pirlo', 'MID', 93, 76, 96, 60, 'İtalya', 'tor-nero', 30, ['onsezi-pasi', 'olu-kose'], 'Sakalı kadar pası da zarif; frikikleri şiirdir.'],
  ['Steven Gerrard', 'MID', 93, 88, 92, 70, 'İngiltere', 'liv-docks', 27, ['son-vurus', 'ikinci-top-avcisi'], "İstanbul gecesinin kaptanı; imkânsız maç tanımaz."],
  ['Luís Figo', 'MID', 93, 88, 92, 55, 'Portekiz', 'lis-leao', 27, ['ters-top', 'tempo-hirsizi'], 'Çizgide dans eder, savunmayı ipe dizer.'],
  ['Gheorghe Hagi', 'MID', 93, 90, 93, 48, 'Romanya', 'ist-falcons', 33, ['olu-kose', 'ucuncu-goz'], "Karpatların Maradona'sı; sol ayağı vakıf malı."],
  ['Alex de Souza', 'MID', 92, 89, 93, 45, 'Brezilya', 'ank-meridian', 32, ['kilit-pas', 'olu-kose'], 'Kadıköy’de heykeli var; frikik demek Alex demek.'],
  ['David Beckham', 'MID', 91, 84, 92, 58, 'İngiltere', 'man-reds', 26, ['ters-top', 'olu-kose'], 'Orta sahadan posta koduna teslimat yapar.'],
  ['Sergen Yalçın', 'MID', 90, 88, 91, 40, 'Türkiye', 'izm-marina', 27, ['dar-alan-ustasi', 'igne-deligi'], 'Topla arası aşk meşk meselesi; koşmaz, düşündürür.'],
  // ---- DEFANS ----
  ['Paolo Maldini', 'DEF', 95, 55, 78, 97, 'İtalya', 'mil-vesta', 29, ['zamaninda-kayis', 'son-adam'], 'Müdahale etmek zorundaysan zaten hata yapmışsındır, derdi.'],
  ['Franz Beckenbauer', 'DEF', 96, 68, 90, 96, 'Almanya', 'mun-adler', 28, ['saha-akli', 'sessiz-mudahale'], 'Kayzer; savunmayı yönetmez, sahayı yönetir.'],
  ['Cafu', 'DEF', 93, 78, 85, 92, 'Brezilya', 'rom-aurea', 29, ['ters-kademe', 'omuz-omuza'], 'Pendik treni gibi: 90 dakika inip çıkar, hiç yorulmaz.'],
  ['Roberto Carlos', 'DEF', 93, 82, 80, 91, 'Brezilya', 'mad-crown', 28, ['duvar-etkisi', 'olu-kose'], 'Sol ayağından çıkan füzeler hâlâ fizikçileri şaşırtıyor.'],
  ['Fabio Cannavaro', 'DEF', 93, 50, 72, 96, 'İtalya', 'nap-vulcano', 32, ['zamaninda-kayis', 'hava-kilidi'], 'Boyu değil zamanlaması uzundur; 2006’nın duvarı.'],
  ['Rio Ferdinand', 'DEF', 91, 52, 78, 94, 'İngiltere', 'man-reds', 28, ['sessiz-mudahale', 'alan-kilidi'], 'Panik nedir bilmez; savunmayı beyefendi gibi yapar.'],
  ['Lúcio', 'DEF', 90, 60, 70, 93, 'Brezilya', 'mil-serpenti', 30, ['govde-koydu', 'omuz-omuza'], 'Topla rakip arasına gövdesini koyar, pazarlık etmez.'],
];

type GRow = [
  name: string,
  ovr: number,
  ref: number,
  command: number,
  distribution: number,
  nat: string,
  club: string,
  age: number,
  perks: [string, string],
  flavor: string,
];

const gkRows: GRow[] = [
  ['Gianluigi Buffon', 95, 96, 93, 82, 'İtalya', 'tor-nero', 30, ['kale-muhru', 'panik-yok'], 'Superman lakabı ona iltifat değil, tespittir.'],
  ['Iker Casillas', 94, 96, 88, 80, 'İspanya', 'mad-crown', 27, ['son-nefes-refleksi', 'karsi-karsiya-sogugu'], 'Aziz Iker; imkânsız kurtarışların koleksiyoncusu.'],
  ['Peter Schmeichel', 94, 94, 93, 78, 'Danimarka', 'man-reds', 30, ['yumruk-cikisi', 'gozunu-kirpmadi'], 'Kalede bağıran bir dev; yıldız açılışı onun markası.'],
  ['Edwin van der Sar', 92, 92, 90, 90, 'Hollanda', 'ams-noord', 29, ['ilk-hamle', 'kontra-fitili'], 'Ayaklarıyla oyun kuran ilk modern kaleci.'],
  ['Cláudio Taffarel', 92, 93, 86, 76, 'Brezilya', 'ist-falcons', 32, ['tek-el-mucizesi', 'direk-dibi'], 'UEFA gecelerinin sarı-kırmızı sigortası.'],
  ['Rüştü Reçber', 91, 93, 85, 72, 'Türkiye', 'ank-meridian', 29, ['son-nefes-refleksi', 'cizgi-buyucusu'], 'Yüzündeki boya savaş ilanıdır; 2002’nin duvarı.'],
];

export const legendFieldPlayers: FieldPlayer[] = fieldRows.map(
  ([name, pos, ovr, atk, mid, def, nat, club, age, perks, flavor], i) => ({
    id: `lg-f-${i}`,
    name,
    position: pos,
    rarity: 'icon',
    ovr,
    age,
    atk,
    mid,
    def,
    nationality: nat,
    league: leagueOfClub[club],
    club,
    perks: [...perks],
    isIcon: true,
    flavorText: flavor,
    captainTrait: 'Efsaneler sahaya çıkınca takım iki numara büyür.',
  }),
);

export const legendGoalkeepers: Goalkeeper[] = gkRows.map(
  ([name, ovr, ref, command, distribution, nat, club, age, perks, flavor], i) => ({
    id: `lg-g-${i}`,
    name,
    position: 'GK',
    rarity: 'icon',
    ovr,
    age,
    ref,
    command,
    distribution,
    nationality: nat,
    league: leagueOfClub[club],
    club,
    perks: [...perks],
    isIcon: true,
    flavorText: flavor,
    captainTrait: 'Efsaneler sahaya çıkınca takım iki numara büyür.',
  }),
);
