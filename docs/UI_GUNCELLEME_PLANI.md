# 6Pas: Draft Arena — v0.2 Arayüz Güncelleme Planı

> Kapsam: saha üstü draft/kadro görünümü, kimya highlight, draft UX, maç içi UI,
> detaylı maç sonu, anlatım bankası genişletme, Gece Baskısı (koyu tema).
> Durum: **Onay bekliyor** — onay sonrası kodlamaya geçilecek. Oyun mantığı/dengesi değişmiyor.

---

## 1. Saha Üstü Görünüm — `PitchView` (draft + kadro + rakip)

### Görsel dil kararı (önerim)

Yeşil çim dokusu yerine **gazete taktik krokisi**: eski spor gazetelerinin maç önü
diziliş grafikleri gibi, kâğıt zemin üzerine mürekkeple çizilmiş halısaha.
Tema kimliğiyle birebir örtüşür ve Gece Baskısı'nda da doğal durur.

- Kâğıt zemin üzerine **çok hafif yeşil mürekkep yıkaması** (%6-8 opaklık) → "renkli baskı" hissi
- Saha çizgileri: orta çizgi, orta yuvarlak, iki ceza sahası — ince mürekkep çizgisi (SVG)
- Dikey yerleşim: kale altta (GK) → DEF → MID → ATK yukarı doğru
- Diziliş slotları formasyondan hesaplanır (2-2-1, 1-2-2, 1-3-1, 2-1-2)

### Oyuncu jetonları (token)

Sahada her oyuncu bir **rozet/jeton**:

- Daire jeton: içinde OVR (büyük) + altında soyad etiketi (gazete altyazısı gibi)
- Jeton halkası **rarity renginde**; İkon'da çift altın halka + hafif varak parıltısı
- Kaptanda Ⓒ mühürü, jetonun köşesinde
- Boş slot: kesikli daire + pozisyon etiketi ("ATAK") — draft'ta tıklanabilir
- Jetona tıklama: **oyuncu kartı popover** açılır (mevcut PlayerCard yeniden kullanılır)

### Nerede kullanılacak

| Ekran | Kullanım |
|---|---|
| DraftScreen | Boş slotlar saha üstünde; tıkla → 3 aday paneli (mobilde alt sayfa/bottom-sheet) |
| SquadReviewScreen | Dolu kadro sahada; yedekler saha kenarında "kulübe" şeridi |
| MatchmakingScreen | Rakip kadrosu da aynı sahada gösterilir (liste yerine) |
| HalfTimeScreen | Değişiklik seçimi saha üstünden: çıkacak oyuncuya dokun → uygun yedekler vurgulanır |

## 2. Kimya Highlight — bağların görselleştirilmesi

- Jetona **dokun/üzerine gel** → takım arkadaşlarına bağ çizgileri çizilir:
  - Aynı **kulüp**: kalın **altın** çizgi
  - Aynı **lig**: **yeşil** çizgi
  - Aynı **uyruk**: **kesikli mürekkep** çizgisi
  - Kaptan bağı: Ⓒ jetonundan gelen çizgide küçük mühür işareti
- Hiçbir bağı olmayan oyuncu jetonu hafif soluk ("kopuk") görünür → draft'ta fark edilir
- ChemistryPanel korunur; panelin kaynak satırına dokununca ilgili bağlar sahada yanıp söner
- **Draft aday kartlarında kimya delta rozeti**: her adayın üstünde
  "Kimya +6" / "Kimya ±0" rozeti — bu adayı seçersen takım kimyasının nasıl değişeceği
  önceden hesaplanıp gösterilir (calculateTeamChemistry zaten saf fonksiyon, bedava)

## 3. Draft Ekranı UX İyileştirmeleri

- Saha üstü slot seçimi (madde 1)
- **İlerleme göstergesi**: "Seçim 7 / 9" — gazete sayfa numarası üslubunda
- **Aday karşılaştırma**: kartlarda stat çubukları (üç adayın en yükseği vurgulu),
  kimya delta rozeti, perk sayısı ikonu
- **İkon anı**: İkon aday geldiğinde kart kısa altın varak parlamasıyla açılır +
  "MATBAADAN SON DAKİKA: İKON!" mini manşet şeridi (ağır animasyon yok, reduced-motion'a saygılı)
- İlk seçim sonrası "KAPTAN BELİRLENDİ" onay şeridi + jetonda Ⓒ mühürü
- Yedek pozisyon seçimi tek dokunuşlu chip'lere dönüşür (modal yerine)

## 4. Maç İçi UI İyileştirmeleri

- **Skorbord altına golcü listesi**: ⚽ 24' Mbari · 41' Güleran (iki takım iki kolon)
- **Dakika şeridi (timeline)**: 0-60(-70) yatay çizgi; gol ⚽, kurtarış 🧤, korner 🚩
  işaretleri dakikasına oturur; aktif dakika ibresi ilerler
- **Olay piktogramları**: anlatım satırlarının başında mürekkep tarzı küçük ikon
  (şut, gol, kurtarış, blok, korner) — satır tarama kolaylaşır
- **GOOOL bandı**: gol anında tam genişlik vermil manşet şeridi (1sn), sayfada
  çok hafif "baskı sarsıntısı" — `prefers-reduced-motion` ile kapanır
- **Dokun-ilerle**: sütuna dokununca sıradaki satır beklemeden düşer (mobilde akıcı)
- **Momentum ibresi (öneri)**: son 3 eventten türeyen "baskı" göstergesi —
  hangi takım üstün, ibre o yöne yatar (gazete barometre grafiği üslubunda)
- Devre arasına geçişte "ARA — İkinci yarı birazdan" vinyet kartı

## 5. Maç Sonu — "Ertesi Sabahın Gazetesi" (tam sayfa ön sayfa)

Maç sonu ekranı gerçek bir gazete ön sayfasına dönüşür:

1. **Dinamik manşet üreteci** (kural tabanlı, maç gerçeklerinden):
   - Penaltı zaferi → "PENALTILARDA DESTAN YAZDILAR"
   - Son dakika golü → "SON NEFESTE!"
   - 3+ gol + clean sheet → "SAHADA FIRTINA ESTİ"
   - Geri dönüş (geriden kazanma) → "KÜLLERİNDEN DOĞDU"
   - Mağlubiyet → "MATBAA KARANLIK BASTI" vb. (≥12 manşet şablonu, durum öncelik sıralı)
2. **Alt başlık**: maçın 1-2 cümlelik özeti (kritik anlardan derlenir)
3. **Skor kutusu**: final + ilk yarı skoru + (varsa) uzatma/penaltı satırı
4. **Gol listesi**: iki kolon, dakika sıralı (⚽ 18' Mbari)
5. **Maç istatistikleri karşılaştırması** (bar'lı): önemli an, şut, isabetli şut,
   kurtarış, kimya — event verisinden türetilir, motor değişmez
6. **Maçın Adamı köşesi**: mini oyuncu kartı + gerekçe satırı
   ("2 gol", "4 kurtarış" — event katkılarından)
7. **Puan dökümü + seri şeridi**: mevcut döküm korunur; streak "🔥 4" rozeti büyür
8. Kazanınca/kaybedince aksiyon butonları aynı kalır

## 6. Anlatım Bankası Genişletme

- Varyant hedefi: event tipi × faz başına **6 → 10-14 satır** (toplam ~400+ satır)
- **Tüm 60 perk için** perk-özel aksiyon/kurtarış satırı (şu an ~20 perkte var)
- **Bağlam duyarlı satırlar**: son dakika gerilimi, farklı öndeyken rahat anlatım,
  geriden gelme heyecanı, İkon oyuncuya özel saygı tonu ("tecrübe konuştu")
- Golcü/asistçi çeşitlemeleri: aynı oyuncu 2. golünü atınca farklı ton ("yine o!")
- Penaltı bankası genişletme (atış öncesi/sonrası varyantlar)
- Devre arası ve maç sonu özet cümle havuzları büyür
- Yapı korunur: locale-keyed (`tr`), tekrar koruması maç içi; **maçlar arası hafıza**
  (son maçta kullanılan şablonlardan kaçınma) eklenir

## 7. Gece Baskısı — Koyu Tema

- **Altyapı**: renkler CSS custom property token'larına taşınır
  (`--paper`, `--ink`, `--grass`, `--vermil`, `--gold`); Tailwind config token'ları okur
- **Gece Baskısı paleti**: sıcak siyah kâğıt (`#17140F` bandı), fildişi mürekkep
  (`#EDE4D2`), altın varak aynı kalır (koyuda daha çok parlar), vermil bir ton açılır
- Kâğıt dokusu gece baskısında "koyu baskı deseni"ne dönüşür
- **Geçiş**: masthead'de "☀ GÜNDÜZ / ☾ GECE BASKISI" düğmesi; tercih localStorage'da,
  ilk açılışta sistem tercihi (`prefers-color-scheme`) izlenir
- Tüm yeni bileşenler (saha, timeline, manşetler) iki temada da tasarlanıp test edilir

---

## Ek Önerilerim (onayına sunulur)

| # | Öneri | Değer | Maliyet |
|---|---|---|---|
| Ö1 | **"Kupürü Kes"**: maç sonu ön sayfasını PNG olarak indir/paylaş (canvas) | Sosyal paylaşım, organik yayılım | Orta |
| Ö2 | **Momentum ibresi** maç içinde (madde 4'te) | Maç izleme hissi güçlenir | Düşük |
| Ö3 | **Ses dokunuşları**: düdük, gol uğultusu (kapatılabilir, varsayılan açık değil) | Atmosfer | Orta |
| Ö4 | **Run tarihçesi**: HomeDashboard'da son maç kupürleri (mini skor kutuları) | Bağlılık, ilerleme hissi | Düşük |
| Ö5 | **Sezon numarası/rozetler**: 5+ seri, İkon avcısı vb. başarım mühürleri | Uzun vadeli hedef | Orta (sonraya) |

Önerim: **Ö2 ve Ö4 bu sürüme girsin** (düşük maliyet, yüksek his), Ö1 sürüm sonunda
vakit kalırsa, Ö3 ve Ö5 v0.3'e.

## Uygulama Sırası (onay sonrası)

| Faz | İş | Neden bu sıra |
|---|---|---|
| 1 | Tema token altyapısı + Gece Baskısı | Sonraki her bileşen iki temada doğar, rework olmaz |
| 2 | PitchView + jetonlar + kimya bağ çizgileri | Draft/kadro/rakip/devre arası hepsinin temeli |
| 3 | Draft UX (kimya delta, ilerleme, İkon anı, kaptan şeridi) | PitchView üstüne kurulur |
| 4 | Maç içi UI (timeline, golcüler, piktogramlar, GOOOL bandı, dokun-ilerle, momentum) | Bağımsız blok |
| 5 | Maç sonu ön sayfası (manşet üreteci, istatistikler, gol listesi, MOTM, Ö4 kupürler) | Motor yardımcıları (istatistik türetme) burada eklenir |
| 6 | Anlatım bankası genişletme + iki temada e2e test + ekran görüntüsü turu | Kapanış ve doğrulama |

**Motor etkisi:** Oyun mantığı ve denge değişmiyor. Sadece türetme yardımcıları eklenir
(gol listesi, yarı skoru, takım istatistikleri, manşet seçici) — hepsi mevcut event
verisinden okunur, simülasyona dokunulmaz.
