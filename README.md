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
- Mock login (menajer adı) → **mod seçimi** → takım ismi → diziliş (2-2-1 / 1-2-2 / 1-3-1 / 2-1-2) → oyun tarzı + taktik planı → draft → maç → puan → tablo
- **📰 Klasik Mod**: kaybedince run biter, kadro dağılır (roguelike); seri uzadıkça puan katlanır
- **🏆 Turnuva Modu**: Son 32 → Son 16 → Çeyrek → Yarı → FİNAL. Draft biter bitmez **32 takımlık kura ağacı** çekilir; rakipler ağaçtan gelir, diğer maçların skorları tur tur simüle edilir, **tur atlayan takımlar güçlenir** (rampa tavanlı — zorlaşır ama asla "kesin kayıp" olmaz). "Turnuva Ağacı" ekranında tüm kura, skorlar ve kupa yolun görünür. Tur atlama bonusları + şampiyonluk 300p
- Beraberlik yok: **uzatma (61'-70') → seri penaltılar**
- Puan: galibiyet 100 + seri/clean sheet/3+ gol/underdog/İkon kaptan bonusları (+turnuva tur bonusları)

### Draft
- Saha krokisi üzerinde slot seçimi; slot başına **popup'ta 3 aday** (pozisyona özel), seçim zorunlu
- Draft başına **1 "Yeniden Çevir"** hakkı · İlk seçim **kaptan** · "Seçim X/10" ilerleme
- **4 yedek zorunlu: 1 GK + 1 DEF + 1 MID + 1 ATK**
- Aday kartlarında: stat çubukları, perk açıklamaları, yaş, **kimya delta rozeti** (+6 gibi)
- Kadro İnceleme'de **düzenleme modu**: yedek ↔ ilk 6 takası; mevki dışı takas uyarı verir ve kimyayı bozar (-8/oyuncu); kaptan kulübeye oturabilir (uyarı: sahada değilken kaptan katkısı işlemez); kaleye sadece kaleci

### Kimya
- 0-100; kulüp çifti +8, lig çifti +3, uyruk çifti +3, kaptan bağları +2
- Sahada jetona dokun → **bağ çizgileri** (altın=kulüp, yeşil=lig, kesikli=uyruk); bağsız oyuncu soluk

### Maç motoru (event-bazlı, sonuç önceden belli değil)
- d20 + stat + perk + kaptan + taktik + kimya; tüm hesap gizli, anlatım doğal Türkçe yayın dili
- **Duran toplar**: faul → serbest vuruş / penaltı zinciri; korner takip pozisyonları
- **Kartlar**: sarı/çift sarı/direkt kırmızı — kırmızıda **maç durur**, eksik oynamanın etkisi hissedilir ve skorbordda "sahada 5 kişi" rozeti çıkar
- **Sakatlık**: kullanıcı takımında **zorunlu değişiklik için maç otomatik durur** (farklı mevkiden oyuncu da girebilir); ghost rakipte oto değişiklik
- **Gerginlik/kavga** olayları (💢) · Ghost rakibin taktiksel oto değişikliği
- 3 değişiklik hakkı: devre arası + **maç içi "Kenara Talimat"** (değişiklik / taktik / **mevki kaydırma**: ör. kırmızı sonrası ortasahacıyı savunmaya çek)
- 🧢 **Yardımcı antrenör**: devre arası ve kenara talimatta gidişata göre öneri (plan/değişiklik/mevki veya moral yorumu) + tek tık **Uygula**
- Taktik kaymaları anlatıma "📋 kenar notu" düşer; skorbord altında aktif taktikler
- **Perkler güce/nadirliğe göre dağılır** (tavan 2): sıradan oyuncular çoğunlukla perksiz, pro 1, yıldız 1-2, efsane/ikon 2; tetiklenince "✍ Muhabir notu: {perk} imzası — {oyuncu}"

### Maç ekranı
- **Canlı saha**: top anlatımla eşzamanlı süzülür (golde metinle birlikte ağlara, poz sonraki satıra dek ekranda kalır)
- Penaltılarda (maç içi + seri) **önden kale sahnesi**: direkler + ağ + penaltı noktası; eldivenler kurtarışta topun köşesine uçar, golde ters köşede kalakalır. Vuruşlar üst/yerden köşelere, ortaya, direğe ve auta gider — **anlatım ve görsel her vuruşta birebir aynı hikâyeyi anlatır**
- **Maç saati dakika dakika ilerler**, olaylar dakikası gelince düşer
- **Canlı kadro panelleri**: PC'de sağ/sol, mobilde altta — oyuncular **anlık reytingleriyle** (SofaScore tarzı, kaleci notları dengeli) + **katkı ve durum ikonları** (⚽ gol sayısı kadar, 🅰️ asist, 🧤 kurtarış, 🟨🟥⚕️🔁; oyundan çıkan soluk)
- Timeline (⚽🟨🟥⚕🔁💢), golcü listesi ((P)/(SV) imli), momentum ibresi, GOOOL bandı + gol kupürü, takım etiketli/renk şeritli satırlar, TD isimleri, hız 1x/2x + dokun-ilerle + ileri sar

### Maç sonu: "Ertesi Sabahın Gazetesi"
- Dinamik manşet ("SON NEFESTE!", "PENALTILARDA DESTAN"...), yarı skoru, gol/kart listeleri
- İstatistik karşılaştırma barları, Hakem Karnesi, gerekçeli Maçın Adamı
- **İmza Hareketleri** (maça dokunan perkler ×sayaç) · **Oyuncu Karneleri** (4.5-10.0)
- Ana sayfada son maç **kupür arşivi**

### Evren, Tablolar & Tema
- ⭐ **Tek evren**: 20 kulüp, **2025-26 gerçek kadroları** (~210 oyuncu, güncel OVR'lar, yıldızlara imza perkleri) her zaman açık — fake havuz yalnızca eski kayıtların çözülmesi için arşivde
- 🥇 **İki ayrı puan tablosu**: Klasik (puan + en iyi seri) ve Turnuva (puan + en iyi aşama) — sekmeli ekran
- 📒 **Geçmişim — Takım Defteri**: biten her run kaydedilir; hangi takımla, hangi kaptanla, nereye kadar gidildiği ana sayfada listelenir
- ☾ **Gece Baskısı** koyu tema (masthead'den geçiş)
- 🗑 Ana sayfada **debug sıfırlama** (iki aşamalı onay, tüm veriyi siler)

### Denge (1000 maç, kalibre)
~2.3 gol/maç · skorlar çoğunlukla 1-0/0-0/2-1/2-0 · 7+ gol <%1 · kurtarış ~2.1/maç, kaçan şut ~2.3/maç (kaçan > kurtarış) · penaltı dönüşümü ~%78 · sarı 0.8/maç · kırmızı ~%5 · sakatlık ~%7 · uzatma ~%33, seri penaltı ~%28

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

## Online Mod (hesaplar + canlı ortak puan tabloları)

Supabase env değişkenleri verilirse oyun **canlı moda** geçer: kullanıcı adı + şifreyle
kayıt/giriş, statlar hesaba yazılır (atomik `apply_match_outcome` RPC), Klasik/Turnuva
puan tabloları tüm oyuncular için ortak ve canlıdır, Takım Defteri hesabında saklanır.
Env verilmezse her şey lokal çalışır (tek dosyalık sürüm dahil).

**Yayınlamak için:** [`DEPLOY.md`](DEPLOY.md) — Supabase (schema.sql + Confirm email kapat)
+ Vercel (repo import + 2 env değişkeni), ~15 dakika.

## Yol Haritası
1. **Online PvP maç** — kural taslağı onay bekliyor: [`docs/ONLINE_KURALLAR.md`](docs/ONLINE_KURALLAR.md)
   (yarı başına 1 mola/25 sn, zorunlu duraklamalar moladan sayılmaz, 45 sn devre arası,
   kopan tarafın kadrosunu AI devralır, davet kodlu özel maç)
2. Ranked (Elo alanları hazır) · Hava koşulları (WeatherModifier iskeleti motorda)
