# 🌐 Online PvP Kuralları (ONAYLANDI — uygulanacak set)

Temel ilke: **rakibin oyun zevki bozulmaz.** Her kural bu süzgeçten geçirildi.
Maç iki tarafta da AYNI sunucu-otoriteli yayını oynatır; kimse hızlandıramaz,
atlayamaz, geriye saramaz. 60 dakikalık maç gerçek zamanda ~6-7 dakika sürer.

## 1. Mola (oyunu durdurma) hakkı

- Her menajerin **yarı başına 1 molası** vardır (maçta toplam 2). **Uzatmada mola YOK** — gerilim bozulmaz.
- Mola **20 saniye** sürer; süre dolunca oyun OTOMATİK devam eder (rakip bekletilemez).
- Mola sırasında molayı alan tarafın **Kenara Talimat** paneli açılır (değişiklik / taktik / mevki). Rakip ekranında "📣 Rakip mola aldı" bandı + geri sayım görünür; rakip de isterse bu süre içinde SADECE taktik planına bakabilir (değişiklik yapamaz — mola onun değil).
- **Suistimal önlemleri:**
  - Gol sonrası ilk **10 saniye** mola alınamaz (gol sevinci kesilmez).
  - Son 5 dakikada (55'+) mola süresi **12 saniyeye** düşer (zaman geciktirme taktiği olmasın).
  - Seri penaltılar sırasında mola alınamaz.

## 2. Zorunlu duraklamalar (moladan sayılmaz)

- **Kırmızı kart** veya **ciddi sakatlık** olduğunda oyun iki taraf için de **20 saniye** otomatik durur.
- Bu sürede yalnızca **etkilenen taraf** müdahale edebilir (zorunlu değişiklik / mevki kaydırma). Rakip izler; süre bitince oyun devam eder.
- Bu duraklamalar mola hakkından DÜŞMEZ — cezalıya ekstra ceza olmaz.

## 3. Devre arası

- Sabit **45 saniyelik** pencere; iki taraf da değişiklik/taktik yapar.
- İki taraf da "Hazırım" derse ikinci yarı ERKEN başlar (kimse boşuna bekletilmez).

## 4. Bağlantı kopması / terk

- Kopan tarafa **30 saniye** yeniden bağlanma penceresi; rakip ekranında "Rakibin bağlantısı koptu" bandı + sayaç.
- Dönmezse maç **hükmen bitmez**: kadroyu yardımcı antrenör (AI) devralır ve maç normal oynanır — kalan oyuncunun maç zevki çalınmaz, kopan taraf haksız hükmen avantaj/dezavantaj yaşamaz.
- Maç başında hiç bağlanılmazsa (ilk 30 sn) maç iptel edilir, kimseye puan yazılmaz.

## 5. Eşleşme

- **Hızlı Maç**: güç bandı ±4 içinde ilk uygun rakip; 45 sn içinde rakip yoksa bot (ghost) devreye girer — kuyrukta süründürmek yok.
- **Özel Maç (arkadaş)**: 6 haneli davet kodu; arkadaşın kodu girer, maç başlar.
  - **Puan tablosuna İŞLEMEZ** (dostluk maçı — tablo kasılamaz).
  - **Head-to-head geçmişe İŞLENİR**: "Bu rakibi 4 kez yendin, 2 kez kaybettin" gibi ikili
    bilanço hesapta tutulur ve maç öncesi/sonrası gösterilir.
  - **Her özel maçta iki taraf da SIFIRDAN draft yapar** — hazır/kasılmış kadroyla gelinmez,
    eşit şartlarda kurulur (draft süresi sınırlı: seçim başına ~25 sn, süre dolarsa en güçlü aday otomatik).

## 6. Puanlama

- Hızlı maç galibiyeti klasik puanlamayla `pvp_points` olarak ayrı kolonda tutulur; PvP puan tablosu üçüncü sekme olur.
- Özel maçlar puan vermez; yalnızca head-to-head bilançoya yazılır.
- Terk edilen maçta AI devralırsa sonuç normal sayılır (kaçarak seri korunamaz).

## 7. Teknik iskelet (bilgi)

- Maç tohumu (seed) + iki kadro sunucuda sabitlenir; iki istemci aynı deterministik simülasyonu oynatır, müdahaleler (mola/değişiklik) Supabase Realtime kanalından karşıya iletilir ve dakika damgasıyla akışa işlenir.
- Uyuşmazlık durumunda sunucu kaydı esastır.

---
**Karar geçmişi (onaylandı):**
1. Mola süresi: **20 sn** (son 5 dk'da 12 sn).
2. Uzatmada mola: **yok**.
3. Özel maçlar: puan tablosuna **işlemez**; head-to-head geçmişe **işlenir**; her özel maçta **sıfırdan draft**.
