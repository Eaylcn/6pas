// "Gerçek Yıldızlar Modu" — test amaçlı, şifreyle açılır.
// Motor/veri kimlikleri değişmez; yalnızca görünen isimler dönüştürülür:
// İkonlar inspiredBy adını alır, fake kulüp/ligler gerçek karşılıklarına çevrilir.
import { clubs } from './clubs';
import { leagues } from './leagues';
import { iconFieldPlayers, iconGoalkeepers } from './icons';

const REAL_MODE_KEY = '6pas:realMode';
export const REAL_MODE_PASSWORD = '123'; // test amaçlı geçici şifre

const realLeagueNames: Record<string, string> = {
  tpc: 'Süper Lig',
  icl: 'La Liga',
  eml: 'Premier League',
  ied: 'Serie A',
  fsl: 'Ligue 1',
  gpl: 'Bundesliga',
  dnl: 'Eredivisie',
  pcl: 'Primeira Liga',
};

const realClubNames: Record<string, string> = {
  'ist-falcons': 'Galatasaray',
  'ank-meridian': 'Fenerbahçe',
  'izm-marina': 'Beşiktaş',
  'mad-crown': 'Real Madrid',
  'val-sol': 'Atlético Madrid',
  'sev-roja': 'Barcelona',
  'man-forge': 'Manchester City',
  'lon-borough': 'Arsenal',
  'liv-docks': 'Liverpool',
  'mil-vesta': 'Milan',
  'rom-aurea': 'Roma',
  'tor-nero': 'Juventus',
  'par-etoile': 'Paris Saint-Germain',
  'lyo-lumiere': 'Olympique Lyon',
  'mun-adler': 'Bayern München',
  'dor-vale': 'Borussia Dortmund',
  'ams-noord': 'Ajax',
  'rot-haven': 'Feyenoord',
  'por-mare': 'Porto',
  'lis-azul': 'Benfica',
};

export function isRealModeEnabled(): boolean {
  try {
    return localStorage.getItem(REAL_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setRealMode(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(REAL_MODE_KEY, '1');
    else localStorage.removeItem(REAL_MODE_KEY);
  } catch {
    // depolama kapalıysa oturumluk kalır
  }
}

/**
 * Uygulama açılışında (render'dan önce) bir kez çağrılır.
 * Havuzdaki nesneler yerinde güncellenir; id'ler değişmediği için
 * kayıtlı run'lar ve motor aynen çalışır.
 */
export function applyRealModeNames(): void {
  for (const p of [...iconFieldPlayers, ...iconGoalkeepers]) {
    if (p.inspiredBy) p.name = p.inspiredBy;
  }
  for (const club of clubs) {
    const real = realClubNames[club.id];
    if (real) club.name = real;
  }
  for (const league of leagues) {
    const real = realLeagueNames[league.id];
    if (real) league.name = real;
  }
}
