import type { WeatherModifier } from '../types';

/**
 * MVP'de hava koşulları aktif değildir; motor nötr modifier ile çalışır.
 * İleride 'yağmurlu', 'rüzgarlı' vb. modifier'lar buradan üretilecek ve
 * matchEngine'deki skor hesabına tek noktadan bağlanacak.
 */
export function getNeutralWeather(): WeatherModifier {
  return { id: 'notr', passAccuracy: 0, shotControl: 0, gkErrorChance: 0, longShot: 0, chemistryEffect: 0 };
}
