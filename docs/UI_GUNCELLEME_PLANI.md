# 6Pas: Draft Arena — v0.2 Güncelleme Planı

> Kapsam: saha üstü draft/kadro görünümü, kimya highlight, draft UX, maç içi UI,
> detaylı maç sonu, anlatım bankası genişletme, Gece Baskısı (koyu tema) ve
> **maç olayları genişletmesi** (duran toplar, penaltılar, kartlar, sakatlıklar,
> otomatik + maç içi oyuncu değişiklikleri).
> Durum: ✅ **Tamamlandı** (v0.2) — tüm fazlar uygulandı, 1000 maçlık simülasyonla yeniden kalibre edildi, iki temada uçtan uca test edildi.

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

## 8. Maç Olayları Genişletmesi — Duran Toplar, Kartlar, Sakatlıklar

Motorun en büyük genişlemesi. Yeni event tipleri eklenir; anlatım aynı "doğal yayın"
kuralına uyar (mekanik terim sızmaz), skor dengesi 1000 maçlık simülasyonla yeniden kalibre edilir.

### 8.1 Teknik ön koşul: segment bazlı simülasyon

Şu an her yarının eventleri yarı başında topluca üretiliyor. Maç içi müdahale ve
oto değişikliklerin gerçek etki etmesi için üretim **event-bazlı (lazy)** hale gelir:
sıradaki önemli an, bir önceki an ekranda tamamlandıktan sonra, o anki kadro/taktik/kart
durumuyla üretilir. Oynanış hissi değişmez; müdahaleler anında etkili olur.
(İleride online: müdahale anları doğal senkron noktası olur — mimari not.)

### 8.2 Duran toplar

- **Faul kazanma**: savunma dueli kaybedip sert müdahaleye düşerse (düşük savunma zarı)
  atak "faul kazanıldı" ile biter → tehlikeli bölgedeyse **serbest vuruş** eventi doğar.
- **Serbest vuruş** (yeni event tipi `serbest-vurus`): takımın duran top sorumlusu
  (en yüksek ATK+MID karışımı; 'Ölü Köşe' perki sahibiyse o) direkt şut kullanır.
  Baraj + kaleci çözümlemesi mevcut şut mekaniğiyle; 'Ölü Köşe', 'Uçan Eldiven',
  'Duvar Etkisi' gibi mevcut perklerin trigger listesine `serbest-vurus` eklenir.
- **Penaltı (maç içi)** (yeni event tipi `penalti`): ceza sahası içinde faul → tek atış;
  mevcut seri penaltı çözümleyicisi tek atış modunda yeniden kullanılır.
  Anlatımda hakem kararı + itiraz rengi.
- **Korner geliştirmesi**: `corner-won` sonuçları artık %35 ihtimalle takip eventi üretir
  (kafa/karambol) — korner kazanmak gerçekten değerli olur.
- Denge hedefi: maç başına 2-4 duran top anı, penaltı ~%15 maç (0-1 adet).

### 8.3 Sarı / Kırmızı kartlar

- Sert faul → **sarı kart** (event satırı + 🟨). İkinci sarı → **kırmızı**.
  Direkt kırmızı çok nadir (son adam pozisyonunda net gol şansını kesme).
- **Kırmızı etkisi**: takım 5 kişi kalır — pozisyon üretim temposu ve savunma
  duellerine kalıcı ceza; jeton kırmızı mühürlenir, değişiklikle telafi edilemez.
- Oyun tarzı etkisi: Kontra/Defansif takımlar Ofansif rakibe karşı hafif artmış faul
  eğilimi taşır; kart riski taktik seçiminin gizli bedeli olur.
- Denge hedefi: maç başına ortalama 1-3 sarı; kırmızı ~%5 maç.
- Kart geçmişi run'a işlenmez (MVP+1'de maç içi etki; kart cezası birikimi v0.3 adayı).

### 8.4 Sakatlıklar

- Nadir olay (~%10 maç, en fazla 1): sert müdahale/talihsiz iniş → oyuncu devam edemez.
- **Zorunlu oto değişiklik** tetiklenir (bkz. 8.5). Uygun yedek yoksa (pozisyon dolu
  değil veya hak bitti) takım eksik oynar — gerçek risk/drama.
- Sakatlık şiddeti v0.2'de yalnızca **maç içi** etkidir; "sonraki maçı kaçırma"
  (run'a taşınan sakatlık) v0.3 adayı olarak modele esnek bırakılır.
- Anlatım: sağlık ekibi/sedye rengiyle, abartısız.

### 8.5 Otomatik oyuncu değişiklikleri (oyun stiline göre)

Basit bir **menajer beyni** (`autoSubEngine`) her iki takım için çalışır:

| Tetik | Davranış |
|---|---|
| Sakatlık | Aynı pozisyondaki en güçlü yedek anında girer (zorunlu) |
| 45'+ geride & plan Ofansif | Ghost: hücumcu takviyesi (DEF→ATK dönüşümü değil; aynı pozisyon en iyi OVR) |
| 45'+ önde & plan Defansif | Ghost: yıpranan hücumcu yerine taze isim |
| Kullanıcı tarafı | Oto değişiklik **yalnızca sakatlıkta** otomatik; taktiksel olanlar bildirim önerisi olarak düşer ("Kenardan öneri: …"), tek dokunuşla onaylanır |

- Ghost rakip aynı kurallarla tam otomatik oynar (adil rekabet).
- Her değişiklik anlatıma doğal satır olarak düşer (🔁 "58' — {takım} hamlesini yaptı…").

### 8.6 Maç içi manuel değişiklik ve hak sistemi

- Toplam değişiklik hakkı **2 → 3'e** çıkar; devre arası + **maç içi** kullanılabilir.
- Maç içinde: **Duraklat → "Kenara Talimat" paneli** → oyuncu değişikliği (hak varsa)
  ve/veya oyun tarzı ayarı; devam edince kalan eventler yeni durumla üretilir (8.1 sayesinde).
- Maç içi taktik değişikliği sınırı: devre arası hariç en fazla **2 kez** (spam koruması,
  "sürekli müdahale yok" ruhu korunur).
- Sakatlık değişikliği haktan düşer (gerçekçi kadro yönetimi baskısı).
- Aynı pozisyon kuralı geçerli kalır; çıkan oyuncu tekrar giremez.

### 8.7 UI yansımaları

- Timeline'a yeni piktogramlar: 🟨 🟥 ⚕ (sakatlık) 🔁 (değişiklik) ⚽ (duran top golü işaretli)
- Jetonlarda kart mühürü / sakatlık işareti; kırmızı gören oyuncu sahadan düşer
- Maç sonu ön sayfasına **"Hakem Karnesi"** kutusu (kartlar, penaltı kararları) ve
  duran top golü istatistiği
- Golcü listesinde penaltı golü "(P)", serbest vuruş golü "(SV)" imi

---

## 9. Online (PvP) Senkronizasyon Tasarımı — v0.3 notu

Maç motoru artık **event-bazlı (lazy)** üretiyor: sonuç önceden belli değildir; her önemli an,
o anki kadro/taktik/kart/skor durumuyla üretilir ve müdahaleler kalan anları gerçekten değiştirir.
Bu, tek kişilik modda hız/atlama kontrolünü serbest bırakır; **PvP'de ise bırakmaz.** Plan:

- **Senkron canlı yayın:** PvP maçında zaman çizgisi sunucu otoritesindedir; iki taraf da aynı
  tempoda izler. **Hız kontrolü ve "Yarıyı İleri Sar" PvP'de kapalıdır.**
- **Mola hakkı (timeout):** Her menajerin maç başına 1 "Kenara Talimat" molası vardır; kullanınca
  yayın İKİ taraf için de ~20 sn durur (rakip "mola verildi" vinyeti görür), panel kapanınca akış sürer.
- **Devre arası penceresi:** 30 sn'lik çift taraflı müdahale süresi; iki taraf da "hazırım" derse erken başlar.
- **Kopma toleransı:** bağlantı kopan tarafın müdahale hakları otomatik pasif; maç sunucuda akmaya devam eder.
- Tek kişilik (bot) modda mevcut hız/atlama aynen kalır.

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
| 4 | **Motor genişletmesi**: segment bazlı üretim, duran toplar, penaltı, kartlar, sakatlık, oto + maç içi değişiklik, 1000 maçlık yeniden kalibrasyon | UI'dan önce motor oturmalı; timeline/ön sayfa bu veriyi gösterecek |
| 5 | Maç içi UI (timeline + yeni piktogramlar, golcüler, GOOOL bandı, dokun-ilerle, momentum, "Kenara Talimat" paneli) | Faz 4'ün olaylarını görselleştirir |
| 6 | Maç sonu ön sayfası (manşet üreteci, istatistikler, gol listesi, Hakem Karnesi, MOTM, Ö4 kupürler) | Tüm olay verisi hazırken yazılır |
| 7 | Anlatım bankası genişletme (yeni event tipleri dahil) + iki temada e2e test + ekran görüntüsü turu | Kapanış ve doğrulama |

**Denge notu:** Faz 4 skor dağılımını etkileyebilir (penaltı golleri, kırmızı kart etkisi).
Mevcut hedef bant (çoğunlukla 0-0…3-1, 7+ gol ≈ %1) 1000 maçlık simülasyonla yeniden
kalibre edilerek korunur. Kart/sakatlık/duran top oranları da aynı scriptle raporlanır.
