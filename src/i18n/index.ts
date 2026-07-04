import { tr, type Dictionary } from './tr';

// MVP'de tek locale: 'tr'. Yeni dil = yeni sözlük dosyası + buraya kayıt.
const dictionaries: Record<string, Dictionary> = { tr };

let activeLocale = 'tr';

export function setLocale(locale: string): void {
  if (dictionaries[locale]) activeLocale = locale;
}

export function getLocale(): string {
  return activeLocale;
}

/**
 * Sözlükten metin okur: t('draft.headline') veya t('home.runSummary', { teamName: 'X' })
 */
export function t(path: string, slots?: Record<string, string | number>): string {
  const parts = path.split('.');
  let node: unknown = dictionaries[activeLocale];
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return path; // anahtar bulunamadı — geliştirme sırasında görünür olsun
    }
  }
  let text = typeof node === 'string' ? node : path;
  if (slots) {
    for (const [key, value] of Object.entries(slots)) {
      text = text.replaceAll(`{${key}}`, String(value));
    }
  }
  return text;
}
