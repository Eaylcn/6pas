// Online altyapı anahtarı: env değişkenleri build sırasında verilmişse
// oyun "canlı" moda geçer (hesaplar + ortak puan tabloları Supabase'te).
// Env yoksa her şey localStorage mock'unda kalır — tek dosyalık sürüm bozulmaz.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Sık yapılan hata: Supabase panelinden PROJE URL'i yerine REST endpoint'i
 * (…supabase.co/rest/v1/) kopyalanır — o zaman auth istekleri
 * "Invalid path specified in request URL" ile patlar. Burada son ekleri kırpıp
 * taban URL'e indiriyoruz ki yanlış kopyalama kendini onarsın.
 */
function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/(rest|auth|realtime|storage|functions)\/v1$/i, '')
    .replace(/\/+$/, '');
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const url = rawUrl ? normalizeSupabaseUrl(rawUrl) : undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** Canlı (online) mod açık mı? */
export const isOnline = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    if (!isOnline) throw new Error('Online mod kapalı — Supabase env değişkenleri verilmedi.');
    client = createClient(url!, anonKey!);
  }
  return client;
}

/**
 * Kullanıcı adı → sentetik e-posta. Supabase şifreli girişte e-posta ister;
 * oyuncudan e-posta istemiyoruz. Türkçe karakterler sadeleştirilir.
 * NOT: Supabase Auth ayarlarında "Confirm email" KAPALI olmalı (DEPLOY.md).
 */
export function usernameToEmail(username: string): string {
  const slug = username
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9_-]/g, '_');
  return `${slug}@6pas-arena.app`;
}
