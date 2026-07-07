# 🚀 6Pas'ı Yayınlama Rehberi (Canlı Hesaplar + Ortak Puan Tablosu)

Toplam süre: ~15 dakika. İki ücretsiz hesap gerekiyor: **Supabase** (veritabanı + hesaplar) ve **Vercel** (barındırma). İkisi de kredi kartı istemez.

## 1. Supabase kurulumu (~7 dk)

1. [supabase.com](https://supabase.com) → **Start your project** → GitHub ile giriş yap.
2. **New project** de: isim `6pas`, güçlü bir database şifresi seç (not al), bölge **Frankfurt (eu-central-1)** (Türkiye'ye en yakın). Oluşmasını bekle (~2 dk).
3. Sol menü → **SQL Editor** → **New query** → bu repodaki [`supabase/schema.sql`](supabase/schema.sql) dosyasının TAMAMINI yapıştır → **Run**. "Success" görmelisin.
4. Sol menü → **Authentication** → **Sign In / Providers** → **Email** → **"Confirm email" seçeneğini KAPAT** → Save.
   (Oyun e-posta istemez; kullanıcı adından sentetik e-posta üretir. Onay maili açık kalırsa kimse giriş yapamaz.)
5. İki değeri topla:
   - `VITE_SUPABASE_URL` → **Project Settings → General → Project URL** — şu biçimde olmalı:
     `https://XXXXX.supabase.co` — ⚠️ **sonunda `/rest/v1/` OLMAMALI!**
     (Data API sayfasındaki "API URL" `…/rest/v1/` ile biter; onu kopyalarsan
     "Invalid path specified in request URL" hatası alırsın. Oyun bu son eki artık
     otomatik kırpıyor ama doğrusu taban URL.)
   - `VITE_SUPABASE_ANON_KEY` → **Project Settings → API Keys → Publishable key**
     (`sb_publishable_…` ile başlayan). Eski projelerde "Legacy anon key" de kullanılabilir.
     Publishable/anon key'in herkese görünmesi normaldir — güvenlik RLS politikalarında.

## 2. Vercel ile yayınlama (~5 dk)

1. [vercel.com](https://vercel.com) → GitHub ile giriş yap.
2. **Add New → Project** → `eaylcn/6pas` reposunu **Import** et.
3. Framework: **Vite** (otomatik algılar). Build ayarlarına dokunma.
4. **Environment Variables** bölümüne iki değişkeni ekle:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | (Supabase Project URL) |
   | `VITE_SUPABASE_ANON_KEY` | (Supabase anon key) |
5. **Deploy** → 1-2 dk sonra `https://6pas-xxx.vercel.app` gibi bir adres alırsın.
6. Linki arkadaşlarına at. Herkes **Kayıt Ol** ile hesap açar, statlar hesaba yazılır, **Puan Tablosu ekranı herkes için ortak ve canlıdır**.

> Not: `main`/branch'e her push'ta Vercel otomatik yeniden yayınlar — güncellemeler kendiliğinden gider.

## 3. Yerelde online modu denemek (opsiyonel)

```bash
cp .env.example .env        # değerleri doldur
npm run dev                 # giriş ekranı Kayıt Ol / Giriş Yap moduna geçer
```

## Nasıl çalışıyor?

- Env değişkenleri **verilmezse** oyun eskisi gibi %100 lokal çalışır (tek dosyalık `6Pas-Oyna.html` dahil) — hiçbir şey bozulmaz.
- Env **verilirse**: hesaplar Supabase Auth'ta; statlar `profiles` tablosunda (maç sonu atomik `apply_match_outcome` RPC'siyle güncellenir, istemciden toplam gönderilmez); Takım Defteri `run_history` tablosunda; puan tabloları `profiles`'tan canlı okunur.
- Güvenlik: RLS açık — herkes tabloyu OKUR, ama yalnızca kendi satırını güncelleyebilir/ekleyebilir.

## Sorun giderme

| Belirti | Sebep / Çözüm |
|---|---|
| Kayıt oldu ama "oturum başlamadı" hatası | Authentication'da **Confirm email hâlâ açık** — kapat |
| "Profil bulunamadı" | `schema.sql` çalıştırılmamış — SQL Editor'da çalıştır |
| "Bu kullanıcı adı alınmış" | Gerçekten alınmış 🙂 başka isim |
| Tablo boş | Henüz kimse maç bitirmedi; ilk maçtan sonra dolar |
