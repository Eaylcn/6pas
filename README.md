# 6Pas: Draft Arena

6v6 halısaha hissinde, FIFA Draft mantığından esinlenen, **text-based futbol draft auto-battler** web oyunu.

- Kadronu draft et (6 ilk oyuncu + 3 yedek), kaptanını seç.
- Diziliş, oyun tarzı ve taktik planını kur.
- 60 dakikalık maçı doğal futbol yayını üslubunda izle, devre arasında müdahale et.
- Kazandıkça puan ve win streak biriktir; kaybedersen run biter, yeni takım kurarsın.

## Durum

✅ MVP tamamlandı — detaylı geliştirme planı için: [`docs/GELISTIRME_PLANI.md`](docs/GELISTIRME_PLANI.md)

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme sunucusu
npm run build      # tek dosyalık üretim derlemesi (dist/index.html)
npm run balance    # 1000 maçlık skor dengesi simülasyonu
```

## Stack

Vite · React 18 · TypeScript · Zustand · Tailwind CSS (frontend-only MVP, mock service layer + localStorage, i18n altyapılı)

## Görsel Kimlik

**Retro futbol gazetesi** teması: gazete kağıdı kremi zemin, mürekkep koyusu metin, çim yeşili + vintage kırmızı vurgular, manşet tipografisi, altın folyo İKON kartlar. UI dili Türkçe (i18n altyapılı).
