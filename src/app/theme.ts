// Gündüz / Gece Baskısı tema yönetimi.
// Tercih localStorage'da tutulur; yoksa sistem tercihi (prefers-color-scheme) izlenir.

export type ThemeName = 'light' | 'dark';

const KEY = '6pas:theme';

export function getStoredTheme(): ThemeName | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function getActiveTheme(): ThemeName {
  const stored = getStoredTheme();
  if (stored) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
}

export function initTheme(): void {
  applyTheme(getActiveTheme());
}

export function toggleTheme(): ThemeName {
  const next: ThemeName = getActiveTheme() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // depolama kapalıysa tema oturumluk kalır
  }
  applyTheme(next);
  return next;
}
