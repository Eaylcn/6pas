// localStorage üstünde async mock kalıcılık katmanı.
// Gerçek backend'e geçişte yalnızca bu modülün implementasyonu değişir; imzalar sabittir.

const PREFIX = '6pas:';

export async function load<T>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Depolama kapalıysa (ör. kısıtlı iframe) oyun bellek-içi devam eder
  }
}

export async function remove(key: string): Promise<void> {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // sessiz geç
  }
}

/** Debug: oyuna ait TÜM veriyi siler (profil, run, leaderboard, tema, mod tercihi) */
export function resetAllData(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) doomed.push(key);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    // depolama kapalıysa yapılacak bir şey yok
  }
}
