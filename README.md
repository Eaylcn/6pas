# ⚽🗞️ 6Pas: Draft Arena

6v6 halısaha hissinde, FIFA Draft esinli, **retro gazete temalı text-based futbol draft auto-battler** web oyunu. Kadronu draft et, taktiğini kur, maçı "canlı gazete yayını" gibi izle; kazandıkça serini büyüt, kaybedince her şeye sıfırdan başla.

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme sunucusu
npm run build      # tek dosyalık üretim derlemesi (dist/index.html — çift tıkla oyna)
npm run balance    # 1000 maçlık denge simülasyonu raporu
```

## Mevcut Durum (v0.4)

### Oyun döngüsü
- Mock login (menajer adı) → takım ismi → diziliş (2-2-1 / 1-2-2 / 1-3-1 / 2-1-2) → oyun tarzı + taktik planı (kazanırken/beraberken/kaybederken) → draft → maç → puan/seri → leaderboard
- Kaybedince run biter, kadro dağılır (roguelike); beraberlik yok: **uzatma (61'-70') → seri penaltılar**
- Puan: galibiyet 100 + seri/clean sheet/3+ gol/underdog/İkon kaptan bonusları

### Draft
- Saha krokisi üzerinde slot seçimi; slot başına **popup'ta 3 aday** (pozisyona özel), seçim zorunlu
- Draft başına **1 "Yeniden Çevir"** hakkı · İlk seçim **kaptan** · "Seçim X/10" ilerleme
- **4 yedek zorunlu: 1 GK + 1 DEF + 1 MID + 1 ATK**
- Aday kartlarında: stat çubukları, perk açıklamaları, yaş, **kimya delta rozeti** (+6 gibi)
- Kadro İnceleme'de **düzenleme modu**: yedek ↔ ilk 6 takası; mevki dışı takas uyarı verir ve kimyayı bozar (-8/oyuncu); kaptan kulübeye gidemez, kaleye sadece kaleci

### Kimya
- 0-100; kulüp çifti +8, lig çifti +3, uyruk çifti +3, kaptan bağları +2
- Sahada jetona dokun → **bağ çizgileri** (altın=kulüp, yeşil=lig, kesikli=uyruk); bağsız oyuncu soluk

### Maç motoru (event-bazlı, sonuç önceden belli değil)
- d20 + stat + perk + kaptan + taktik + kimya; tüm hesap gizli, anlatım doğal Türkçe yayın dili
- **Duran toplar**: faul → serbest vuruş / penaltı zinciri; korner takip pozisyonları
- **Kartlar**: sarı/çift sarı/direkt kırmızı (5 kişi kalma cezası) · **Sakatlık** + zorunlu oto değişiklik
- **Gerginlik/kavga** olayları (💢) · Ghost rakibin taktiksel oto değişikliği
- 3 değişiklik hakkı: devre arası + **maç içi "Kenara Talimat"** (duraklat → değişiklik/taktik)
- Taktik kaymaları anlatıma "📋 kenar notu" düşer; skorbord altında aktif taktikler
- Perk maks **2/oyuncu**; tetiklenince "✍ Muhabir notu: {perk} imzası — {oyuncu}"

### Maç ekranı
- **Canlı saha**: top anlatımla eşzamanlı süzülür (golde metinle birlikte ağlara); penaltılarda **kaleci köşeye uçar**, topun köşesi görünür
- **Maç saati dakika dakika ilerler**, olaylar dakikası gelince düşer
- **Canlı kadro panelleri**: PC'de sağ/sol, mobilde altta — oyuncular **anlık reytingleriyle** (SofaScore tarzı)
- Timeline (⚽🟨🟥⚕🔁💢), golcü listesi ((P)/(SV) imli), momentum ibresi, GOOOL bandı + gol kupürü, takım etiketli/renk şeritli satırlar, TD isimleri, hız 1x/2x + dokun-ilerle + ileri sar

### Maç sonu: "Ertesi Sabahın Gazetesi"
- Dinamik manşet ("SON NEFESTE!", "PENALTILARDA DESTAN"...), yarı skoru, gol/kart listeleri
- İstatistik karşılaştırma barları, Hakem Karnesi, gerekçeli Maçın Adamı
- **İmza Hareketleri** (maça dokunan perkler ×sayaç) · **Oyuncu Karneleri** (4.5-10.0)
- Ana sayfada son maç **kupür arşivi**

### Modlar & Tema
- ☾ **Gece Baskısı** koyu tema (masthead'den geçiş)
- ⭐ **Gerçek Yıldızlar Modu** (test şifresi: `123`): 20 kulüp, **2025-26 kadroları** (~210 gerçek oyuncu, güncel OVR'lar, yıldızlara imza perkleri). Kapatınca fake evrene döner; kayıtlar iki modda da çalışır.
- 🗑 Ana sayfada **debug sıfırlama** (iki aşamalı onay, tüm veriyi siler)

### Denge (1000 maç, kalibre)
~2.4 gol/maç · skorlar çoğunlukla 1-0/0-0/2-0/2-1 · 7+ gol <%1 · penaltı dönüşümü ~%80 · sarı 0.8/maç · kırmızı ~%5 · sakatlık ~%10 · uzatma ~%32, seri penaltı ~%25

## Mimari

```
src/
├─ app/        # App, tema (CSS token'ları: gündüz/gece)
├─ components/ # PitchView (kroki), LivePitch (canlı top), PlayerCard, Scoreboard...
├─ screens/    # 13 ekran (state-machine router)
├─ data/       # fake evren (~385 üretilmiş + 34 İkon) · realPlayers (2025-26) · perkler/kulüpler/ligler
├─ game/       # match/draft/chemistry/tactics/narration/ratings/report... saf motorlar
├─ services/   # localStorage üstünde async mock (gerçek backend'e hazır imzalar)
├─ store/      # Zustand (oyun akışı + kullanıcı)
└─ i18n/       # tr sözlüğü (locale-keyed anlatım bankaları)
```

Detaylı planlar: [`docs/GELISTIRME_PLANI.md`](docs/GELISTIRME_PLANI.md) · [`docs/UI_GUNCELLEME_PLANI.md`](docs/UI_GUNCELLEME_PLANI.md)

## Yol Haritası
1. **Kayıt olma / hesap sistemi** (mock login → gerçek auth)
2. **Online PvP maç** — plan hazır (UI planı §9): sunucu otoriteli senkron yayın, PvP'de hız/atlama kapalı, mola hakkı + devre arası penceresi
3. Ranked (Elo alanları hazır) · Turnuva · Hava koşulları (WeatherModifier iskeleti motorda)
