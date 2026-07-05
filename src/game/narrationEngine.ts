// Doğal maç anlatımı motoru.
// Altın kural: mekanik hiçbir terim (perk adı, zar, bonus, skor hesabı) metne sızmaz.
import type { EventResult, MatchEventType } from '../types';
import type { Rng } from '../utils/random';

export interface NarrationContext {
  minute: number;
  attacker: string; // hücumdaki oyuncu adı
  helper: string; // asist/pas veren oyuncu adı
  defender: string; // savunan oyuncu adı
  gk: string; // kaleci adı
  team: string; // hücum eden takım
  opponent: string;
  score: string; // olay SONRASI skor "2 - 1"
  perkHints: string[]; // tetiklenen perklerin narration hint anahtarları
  /** Gol sonrası atak yapan takımın durumu — doğru manşet için */
  goalState?: 'ahead' | 'tie' | 'behind';
}

type Bank = Record<string, string[]>;

// ---- Hazırlık (buildup) satırları — event tipine göre ----
const buildupBank: Bank = {
  'calim': [
    "{minute}' {team} topu ileri taşıdı. {attacker} rakibini üstüne çekti.",
    "{minute}' {attacker} topu aldı, karşısındaki {defender}'e doğru sürdü.",
    "{minute}' {team} sabırla oyun kurdu. Top {attacker}'de, önünde tek adam var.",
    "{minute}' {attacker} sol çizgide topla buluştu, hızlanıyor.",
    "{minute}' {team} atakta. {attacker} dar alanda topu saklıyor.",
    "{minute}' {attacker} orta sahadan aldığı topla sürdü, savunma kademeleniyor.",
  ],
  'ara-pas': [
    "{minute}' {team} pas trafiğini hızlandırdı. {helper} oyunu sağdan sola çevirdi.",
    "{minute}' {helper} orta alanda topu yumuşattı, ileriyi kolluyor.",
    "{minute}' {team} üçgen paslarla savunmayı oynatıyor. Top yine {helper}'de.",
    "{minute}' {helper} kafasını kaldırdı, koşu yolunu gördü.",
    "{minute}' {team} tempoyu yükseltti. {helper} savunma önünde boş alan buldu.",
    "{minute}' {helper} iki rakip arasında topla döndü, açı arıyor.",
  ],
  'ters-top': [
    "{minute}' {team} sol kanatta yüklendi. Herkes ortayı beklerken {helper} durdu.",
    "{minute}' {helper} topu içeri sürdü, savunma kalabalık tarafa kaydı.",
    "{minute}' {team} ceza sahası çevresinde pas yaptı. {helper} yönü değiştirmek üzere.",
    "{minute}' {helper} çizgiye indi, savunma içeri toplandı.",
    "{minute}' {team} atağı sağdan geliştirdi, zayıf taraf bomboş.",
    "{minute}' {helper} topu gizledi; savunmanın ağırlığı ters tarafta.",
  ],
  'uzaktan-sut': [
    "{minute}' {team} pozisyon arıyor ama savunma bloğu geçit vermiyor.",
    "{minute}' {attacker} ceza yayının gerisinde topla buluştu.",
    "{minute}' savunma alçaldı, {attacker}'in önünde şut koridoru açıldı.",
    "{minute}' {team} topu çevirdi; {attacker} uzaktan denemek için pozisyon aldı.",
    "{minute}' ikinci top {attacker}'in önüne düştü.",
    "{minute}' {attacker} topu göğsüyle indirdi, kaleye dönüyor.",
  ],
  'dar-aci': [
    "{minute}' {team} sağ kanattan sızdı. {attacker} çizgiye kadar indi.",
    "{minute}' {attacker} savunmanın arasından kale çizgisine doğru daldı.",
    "{minute}' top dar alanda {attacker}'de kaldı; açı neredeyse yok.",
    "{minute}' {attacker} kaleciyle çizgi arasında sıkıştı ama topu bırakmadı.",
    "{minute}' {team} kanattan geldi, {attacker} içeri kat etti.",
    "{minute}' {attacker} savunmacıyı çizgide geride bıraktı.",
  ],
  'karsi-karsiya': [
    "{minute}' {team} hızlı çıktı. {helper} tek pasla oyunun yönünü değiştirdi.",
    "{minute}' {helper} savunmanın arasına o pası koydu. {attacker} sarktı!",
    "{minute}' savunma hattı öne çıkmıştı; {attacker} arkaya sızdı.",
    "{minute}' {attacker} topu önüne aldı, önünde sadece kaleci var.",
    "{minute}' uzun top savunmanın arkasına düştü, {attacker} herkesten önce davrandı.",
    "{minute}' {helper} topu kazandı ve ileri bıraktı; {attacker} yalnız yakalandı.",
  ],
  'rovasata': [
    "{minute}' {team} ortayı yükseğe açtı, top ceza sahasında havalandı.",
    "{minute}' {helper} yandan yüksek bir orta gönderdi.",
    "{minute}' top savunmadan seken bir şekilde havalandı; {attacker} sırtı kaleye dönük.",
    "{minute}' {attacker} göğsüyle yumuşattığı topu havada yakaladı.",
  ],
  'rabona': [
    "{minute}' {attacker} çizgi üzerinde vücut ağırlığını yanlış ayağına verdi.",
    "{minute}' {attacker} topa ters açıda yakalandı ama vazgeçmedi.",
    "{minute}' herkes ortayı beklerken {attacker} topun arkasında ayaklarını çaprazladı.",
  ],
  'plase': [
    "{minute}' {attacker} ceza sahası çevresinde topu aldı, savunmacıyı üstüne çekti.",
    "{minute}' {helper} kısa pasla {attacker}'i döndürdü.",
    "{minute}' {attacker} kesip içeri girdi, açısını arıyor.",
    "{minute}' {team} ceza sahasının solunda üstünlük kurdu; top {attacker}'de.",
    "{minute}' {attacker} savunmacının hamlesini bekledi, topu açtı.",
    "{minute}' {attacker} dar alanda vücut çalımıyla önünü boşalttı.",
  ],
  'kafa': [
    "{minute}' {team} kanattan derinleşti. {helper} ortaya hazırlanıyor.",
    "{minute}' {helper} topu yandan kucakladı ve ölçülü bir orta gönderdi.",
    "{minute}' orta geliyor... {attacker} ceza sahasında yükseldi!",
    "{minute}' {helper} arka direği gördü.",
    "{minute}' yandan kazanılan serbest vuruşta top ceza sahasına gönderildi.",
  ],
  'korner': [
    "{minute}' {team} köşe vuruşu kullanacak. Ceza sahası kalabalık.",
    "{minute}' korner bayrağının dibinden {helper} topun başında.",
    "{minute}' {helper} korneri kısa kullanmadı, topu içeri gönderdi.",
    "{minute}' köşe vuruşunda top penaltı noktasına doğru süzülüyor.",
  ],
  'kontra': [
    "{minute}' {opponent} atağı sonuçsuz kaldı ve {team} bir anda ileri fırladı!",
    "{minute}' top kayıpları pahalı; {team} üç kişiyle hücumda.",
    "{minute}' {helper} topu kaptı ve ileri sürdü; savunma geriden koşuyor.",
    "{minute}' {team} savunmadan çıkan uzun topla bir anda kaleye yaklaştı.",
    "{minute}' hızlı hücum! {helper} topu {attacker}'in koşu yoluna bıraktı.",
  ],
  'blok': [
    "{minute}' {team} baskıyı artırdı, ceza sahası önünde top gezmeye başladı.",
    "{minute}' {attacker} şut pozisyonu buldu gibi...",
    "{minute}' top ceza sahası içinde {attacker}'in önünde kaldı.",
  ],
  'cizgiden': [
    "{minute}' {team} kaleyi ablukaya aldı; top bir türlü uzaklaşmıyor.",
    "{minute}' karambol! Top ceza sahasında {attacker}'in önüne düştü.",
    "{minute}' kaleci topu çıkaramadı, {attacker} dokunmak üzere...",
  ],
  'son-dakika': [
    "{minute}' son dakikalar... {team} her şeyi öne yıktı.",
    "{minute}' maçın kaderi bu atakta belli olabilir. {team} geliyor.",
    "{minute}' tribünler ayakta; {team} son kozunu oynuyor.",
    "{minute}' uzun top ileri... {attacker} mücadele ediyor.",
  ],
  'kurtaris': [
    "{minute}' {team} pozisyona girdi; {attacker} topla ceza sahasında.",
    "{minute}' {attacker} savunmayı ekarte etti, şut hakkı buldu.",
  ],
};

// ---- Aksiyon/şut anı satırları ----
const actionBank: Bank = {
  'calim': [
    '{attacker} çalımını attı, savunmacıyı geride bıraktı!',
    '{attacker} topu bir sağa bir sola yatırdı ve geçti.',
    "{attacker} vücut çalımıyla {defender}'ı ters köşeye gönderdi.",
    '{attacker} topuk pasıyla kendine alan açtı.',
  ],
  'uzaktan-sut': [
    '{attacker} yayın gerisinden gözünü karartıp vurdu!',
    '{attacker} sert ve düşen bir şut çıkardı!',
    '{attacker} topun düşüşüne müthiş bir gerilme ile vurdu!',
    '{attacker} uzaklardan kaleyi yokladı!',
  ],
  'dar-aci': [
    '{attacker} neredeyse sıfır açıdan vuruşunu yaptı!',
    '{attacker} açı yokken bile şutunu çekti!',
    '{attacker} dar açıdan yakın direği zorladı!',
  ],
  'karsi-karsiya': ['Vuruşunu yaptı!', '{attacker} kaleciyle göz göze... ve vurdu!', '{attacker} son dokunuşunu yaptı!'],
  'plase': [
    '{attacker} şut için açıyı buldu... ve plasesini yaptı!',
    '{attacker} topu uzak köşeye doğru bükdü!',
    '{attacker} ayak içiyle zarif bir vuruş çıkardı!',
  ],
  'kafa': ['{attacker} kafayı vurdu!', '{attacker} havada asılı kalıp topa çakıldı!', '{attacker} kafa vuruşunu köşeye yönlendirdi!'],
  'rovasata': ['{attacker} kendini havaya bıraktı... RÖVAŞATA!', '{attacker} sırtı dönükken makasa geldi!'],
  'rabona': ['{attacker} rabonayla vurdu! İnanılmaz bir tercih!', '{attacker} ayaklarını çaprazlayıp rabonayı denedi!'],
  'kontra': ['{attacker} hızını alamadan vuruşunu yaptı!', '{attacker} tek dokunuşla bitirmek istedi!'],
  'ters-top': ['{helper} topu ters kanada açtı; {attacker} gelişine vurdu!', '{helper} beklenmedik anda ters topu çıkardı; {attacker} bomboş vurdu!'],
  'ara-pas': ['{helper} o ara pası koydu; {attacker} topla buluştu ve vurdu!', '{helper} savunmayı tek pasla çizdi; {attacker} bitirmek istedi!'],
  'korner': ['Penaltı noktasında {attacker} yükseldi!', 'Arka direkte {attacker} topa sahip oldu ve vurdu!'],
  'blok': ['{attacker} şutunu çekti!', '{attacker} gelişine sert vurdu!'],
  'cizgiden': ['{attacker} boş kaleye dokundu!', '{attacker} son dokunuşu yaptı, top çizgiye gidiyor!'],
  'son-dakika': ['{attacker} son umut vuruşunu yaptı!', '{attacker} kalabalığın içinden vurdu!'],
  'kurtaris': ['{attacker} köşeyi hedefledi ve vurdu!', '{attacker} sert vurdu!'],
};

// ---- Perk'e özel aksiyon renklendirmesi (perk adı asla yazılmaz) ----
const perkActionBank: Bank = {
  'bilek-kiran': ['{attacker} dar alanda savunmacıyı üstüne çekti, bileğini son anda çevirip önünü boşalttı!'],
  'rovasata-tehdidi': ['{attacker} göğsüyle yumuşattığı topu havada yakaladı, sırtı kaleye dönükken vuruşu denedi!'],
  'rabona-imzasi': ['{attacker} kimsenin beklemediği anda ayaklarını çaprazladı; işte o imza hareket!'],
  'olu-kose': ['{attacker} topun başına geçti ve köşeyi çoktan seçmişti!'],
  'dar-aci-ustasi': ['{attacker} o açıdan vurulmaz denilen yerden vurdu!'],
  'kaleciyle-dans': ['{attacker} kaleciyi önce oturttu, sonra vuruşunu yaptı!'],
  'igne-deligi': ['{helper} iğne deliğinden geçirircesine bir ara pas çıkardı!'],
  'ucuncu-goz': ['{helper} bakmadığı yöne, tam koşu yoluna pası bıraktı!'],
  'savunma-arkasi': ['{attacker} ofsayt çizgisiyle oynadı ve tam zamanında sarktı!'],
  'acimasiz-plase': ['{attacker} sert vuruş yerine köşeye soğukkanlı bir plase seçti!'],
  'tek-dokunus': ['{attacker} topu durdurmadan, tek dokunuşla tamamladı!'],
  'hava-fisegi': ['{attacker} ceza sahasında herkesten yükseğe çıktı!'],
  'son-vurus': ['Maçın en sıcak anında top yine {attacker}’de; sorumluluğu aldı!'],
  'ters-top': ['{helper} herkesi ters köşeye yatıran o topu çıkardı!'],
  'kor-nokta-kosusu': ['{attacker} savunmanın görmediği koridordan sessizce sızdı!'],
  'ilk-temas': ['{attacker} topla ilk buluşmasında tehlikeyi yarattı!'],
  'cift-vurus-sezgisi': ['Dönen topa herkesten önce {attacker} ulaştı!'],
  'ayak-ici-zehri': ['{attacker} ayak içiyle o zehirli vuruşu çıkardı!'],
  'tempo-hirsizi': ['{helper} oyunu bir yavaşlatıp bir hızlandırdı; savunma ritmi şaştı!'],
  'kilit-pas': ['{helper} kilitli savunmayı tek pasla açtı!'],
  'baskidan-cikis': ['{helper} iki adamlık presin içinden topla çıktı!'],
  'pas-muhendisi': ['{helper} cetvelle çizilmiş bir koridor pası buldu!'],
  'saha-akli': ['{helper} kimsenin görmediği boşluğu önceden görmüştü!'],
  'oyunun-nabzi': ['{helper} maçın tam da bu anında oyunu hızlandırdı!'],
  'dar-alan-ustasi': ['{attacker} kalabalığın ortasında topla yaşadı!'],
  'onsezi-pasi': ['Koşu daha başlamadan {helper} pası atmıştı bile!'],
  'sessiz-orkestra': ['Gösterişsiz ama kusursuz: {helper} takımı yine o çalıştırdı.'],
  'pres-kiran': ['{helper} rakip baskısını tek dokunuşla anlamsızlaştırdı!'],
  'ara-koridor': ['{helper} savunmayla orta saha arasındaki gri bölgede topu aldı!'],
  'ikinci-top-avcisi': ['İkinci top yine {helper}’in oldu!'],
};

// ---- Gerilim satırları ----
const suspenseBank: Bank = {
  generic: [
    'Top uzak köşeye gidiyor…',
    'Top ağlarla buluşacak mı…',
    'Kaleci pozisyon aldı…',
    'Savunma nefesini tuttu…',
    'Tribünler ayağa kalktı…',
    'Top havada süzülüyor…',
    'Herkes topun izinde…',
  ],
  close: ['Kaleci uzanıyor…', 'Yetişebilecek mi…', 'Açı çok dar…', 'Top direğe doğru…'],
};

// ---- Sonuç satırları ----
const goalBankNeutral: string[] = [
  'GOOOL! Direğin dibinden ağlara gitti! Skor: {score}!',
  'GOOOL! Kalecinin uzandığı yerden içeri! {team} — {score}!',
  'GOOOL! Muhteşem bir bitiriş! Tabela {score} yazıyor!',
  'GOOOL! {attacker} farkını gösterdi! Skor {score}!',
  'GOOOL! Ağlar havalandı! {team} bulduğu golle {score} önde götürüyor pozisyonun hakkını!',
  'GOOOL! File bekçisinin yapabileceği bir şey yoktu! {score}!',
  'GOOOL! {attacker} soğukkanlılığın ders kitabını yazdı! {score}!',
];

const goalBankByState: Record<'ahead' | 'tie' | 'behind', string[]> = {
  ahead: [
    'GOOOL! Top ağlarda! {team} {score} öne geçiyor!',
    'GOOOL! {team} farkı açıyor: {score}!',
    'GOOOL! {team} skor üstünlüğünü aldı: {score}!',
  ],
  tie: [
    'GOOOL! {team} eşitliği yakalıyor: {score}!',
    'GOOOL! Dengeler yeniden kuruldu: {score}!',
    'GOOOL! {team} maça yeniden ortak oldu: {score}!',
  ],
  behind: [
    'GOOOL! {team} farkı eritiyor: {score}!',
    'GOOOL! {team} umutlandı, skor {score}!',
    'GOOOL! {team} maça tutunuyor: {score}!',
  ],
};

const equalizerOrLeadNote: string[] = [
  '{team} cephesinde büyük sevinç!',
  '{attacker} koşusunu taraftarın önünde tamamladı!',
  'Saha kenarı karıştı, {team} yedek kulübesi ayakta!',
];

const saveBank: string[] = [
  'Kaleci {gk} son anda uzandı ve topu kornere çeldi!',
  '{gk} müthiş bir refleksle topa sahip oldu!',
  '{gk} köşeye uzanıp mutlak golü aldı!',
  '{gk} ayaklarıyla kapattı; top oyun alanı dışına!',
  '{gk} o topu nasıl çıkardıysa... İnanılmaz kurtarış!',
  '{gk} yumruklarıyla tehlikeyi uzaklaştırdı!',
  '{gk} açıyı erken kapattı; {attacker} vuracak yer bulamadı!',
  'Ne kurtarış! {gk} takımını maçın içinde tuttu!',
];

const perkSaveBank: Bank = {
  'son-nefes-refleksi': ['{gk} ters ayakta yakalanmasına rağmen son anda kolunu uzattı! Kurtardı!'],
  'aci-katili': ['{gk} açıyı öyle kapattı ki {attacker}’in vuracağı yer kalmadı!'],
  'ucan-eldiven': ['{gk} üst köşeye giden topa uçtu ve çeldi!'],
  'karsi-karsiya-sogugu': ['{gk} karşı karşıyada gözünü kırpmadı, hamleyi son ana sakladı ve kazandı!'],
  'direk-dibi': ['{gk} yakın direğini kapatmıştı; top eldiveninde kaldı!'],
  'tek-el-mucizesi': ['{gk} tek eliyle o topu çizgiden çıkardı!'],
  'kale-muhru': ['{gk} bugün kalesine mühür vurmuş; bu top da girmiyor!'],
  'cizgi-buyucusu': ['{gk} çizgi üzerinde akıl almaz bir kurtarışa imza attı!'],
  'yumruk-cikisi': ['{gk} yumruğuyla tehlikeyi ceza sahasından söküp attı!'],
  'panik-yok': ['Baskı büyüktü ama {gk} soğukkanlılığını hiç bozmadı; top kucağında.'],
  'kontra-fitili': ['{gk} kurtardı ve saniyeler içinde hücumu başlattı!'],
  'hava-sahasi': ['Ceza sahasındaki yüksek top yine {gk}’nin malı oldu!'],
  'gozunu-kirpmadi': ['Sert şutta {gk} gözünü bile kırpmadı; top güvenle çelildi!'],
  'ilk-hamle': ['Karşı karşıyada ilk hamleyi {gk} yaptı ve açıyı yok etti!'],
  'eldiven-izi': ['{gk} dokundu; değdiği her top gibi bu da kaleden uzaklaştı.'],
};

const missBank: string[] = [
  'Az farkla auta gitti! {team} cephesinde eller başlara gitti.',
  'Top üst direği sıyırıp dışarı çıktı!',
  'Direk! Top direkten döndü, savunma uzaklaştırdı!',
  'Topu köşeye koyamadı; yandan auta gitti.',
  'Vuruş kontrolsüzdü, top üstten auta çıktı.',
  'Son dokunuş eksik kaldı; top kale sahasından geçip gitti.',
  'İnanılmaz bir fırsat böyle kaçtı; {attacker} ellerini dizlerine vurdu.',
  'Top kaleci ile direk arasından çizgiyi bulamadan çıktı!',
];

const blockedBank: string[] = [
  'Savunmadan döndü! {defender} gövdesini koydu.',
  '{defender} ayak koydu ve şutu blokladı!',
  'Araya giren {defender} mutlak pozisyonu sildi.',
  '{defender} son anda kayarak topu çeldi!',
];

const perkBlockBank: Bank = {
  'sut-sonduren': ['{defender} şut anında yine oradaydı; top gövdesinden döndü!'],
  'son-perde': ['{defender} gol olacak topu son anda perdeledi!'],
  'cizgi-supurucu': ['{defender} çizgi üzerinden topu süpürdü! İnanılmaz!'],
  'hava-kilidi': ['{defender} hava topunda yine geçilmedi!'],
  'son-adam': ['Son adam {defender} pozisyonu bitirdi.'],
  'zamaninda-kayis': ['{defender} kusursuz zamanlamayla kaydı, topu aldı.'],
  'omuz-omuza': ['{defender} omuz omuza mücadelede geri adım atmadı, top onun!'],
  'alan-kilidi': ['{defender} bölgesini kilitledi; oradan geçiş yok!'],
  'ters-kademe': ['{defender} arkadaşının arkasını herkesten önce kapattı!'],
  'sessiz-mudahale': ['{defender} faulsüz, tertemiz bir müdahaleyle topu çaldı.'],
  'duvar-etkisi': ['{defender} gövdesini duvar gibi koydu; şut ondan döndü!'],
  'govde-koydu': ['{defender} vücudunu koydu ve pozisyonu öldürdü.'],
  'koridor-kapatan': ['{defender} iç koridoru kapatıp oyunu dışarı itti.'],
  'risk-temizligi': ['{defender} riskli topu taşımadı, tehlikeyi anında temizledi.'],
  'temas-ustasi': ['Omuz temasında top yine {defender}’e kaldı.'],
};

const cornerBank: string[] = [
  'Savunma son anda ayak koydu; top kornere çıktı.',
  '{defender} uzaklaştıramadı ama kornere çelmeyi başardı.',
  'Kaleci topu kornere tokatladı.',
];

const defendedBank: string[] = [
  'Savunma bu kez geçit vermedi; {defender} topu güvenle uzaklaştırdı.',
  '{defender} pası okudu ve araya girdi.',
  '{defender} omuz omuza mücadeleden topla çıktı.',
  'Atak {defender}’in müdahalesiyle kesildi.',
  '{opponent} savunması kademeyi zamanında kurdu.',
];

// ---- Duran top / kart / sakatlık / değişiklik bankaları ----
const foulBank: string[] = [
  "{minute}' {defender} bu kez topu değil adamı buldu. Hakem düdüğü çaldı: faul!",
  "{minute}' {attacker} hızlanmıştı; {defender} sert bir müdahaleyle durdurdu. Serbest vuruş.",
  "{minute}' geç kalan {defender} ayağını uzattı, {attacker} yerde. Hakem faulü verdi.",
  "{minute}' {defender} omuz mücadelesinin dozunu kaçırdı. Oyun durdu.",
  "{minute}' {attacker} çevik davrandı, {defender} çareyi faulde buldu.",
];

const yellowCardLines: string[] = [
  'Hakem kartına davrandı… {defender} sarı kart görüyor.',
  'Bu müdahalenin bedeli var: {defender} sarı kartla cezalandırıldı.',
  'Hakem sözlü uyarıyla yetinmedi; {defender} adına sarı kart.',
];

const secondYellowLines: string[] = [
  'İkinci sarı… VE KIRMIZI! {defender} oyun dışı! {opponent} 5 kişi kaldı!',
  'Hakem önce sarıyı, sonra kırmızıyı gösterdi! {defender} maça erken veda ediyor!',
];

const directRedLines: string[] = [
  'Son adam pozisyonu! Hakem hiç tereddüt etmedi: DİREKT KIRMIZI! {defender} atıldı!',
  'Net gol şansını kesti; kural net. {defender} kırmızı kartla oyun dışı!',
];

const freeKickSetupBank: string[] = [
  "{minute}' {team} tehlikeli bölgede serbest vuruş kazandı. {attacker} topun başında.",
  "{minute}' baraj diziliyor… {attacker} topu yerleştirdi, mesafeyi ölçüyor.",
  "{minute}' bu mesafeden {attacker} için harika bir fırsat. Baraj hazır, hakem düdüğü bekletiyor.",
];

const freeKickShotBank: string[] = [
  '{attacker} vurdu! Top barajın üstünden aşıyor…',
  '{attacker} şutunu çekti; top barajın yanından makaslıyor…',
  '{attacker} topun altına girdi; falsolu bir vuruş…',
];

const freeKickWallLines: string[] = [
  'Baraja takıldı! Savunma bu kez görevini yaptı.',
  'Top barajdan sekti; tehlike büyümeden atlatıldı.',
];

const penaltyCallLines: string[] = [
  "{minute}' ceza sahasında müdahale… Hakem noktayı gösterdi: PENALTI!",
  "{minute}' {attacker} ceza sahasında devrildi! Hakem hiç düşünmedi: PENALTI!",
  "{minute}' itirazlar sonuç vermedi; karar net: beyaz nokta!",
];

const injuryBank: string[] = [
  '{attacker} yerde kaldı… Sağlık ekibi hemen sahada.',
  'Oyun durdu; {attacker} acı içinde. Kenar yönetimi endişeli.',
  '{attacker} devam etmek istedi ama olmuyor. Sedye geliyor.',
];

const injuryExitLines: string[] = [
  '{attacker} oyuna devam edemiyor.',
  'Alkışlar eşliğinde {attacker} sahayı terk ediyor.',
];

const subBank: string[] = [
  "{minute}' {team} hamlesini yapıyor: {helper} çıkıyor, {attacker} oyuna giriyor.",
  "{minute}' kenardan değişiklik geldi. {attacker}, {helper}'in yerine sahada.",
  "{minute}' {team} taze kan istiyor: {attacker} oyunda, {helper} kulübede.",
];

const halftimeBank: string[] = [
  'İlk yarının sonunda tabela {score} yazıyor.',
  'Hakem ilk yarıyı bitirdi. Skor: {score}.',
  '45 değil 30 dakika ama yorucu bir ilk yarıydı. {score} ile devreye giriliyor.',
];

const finalBank: string[] = [
  'Ve maç sonu düdüğü! Tabela son sözünü söyledi: {score}.',
  'Hakem maçı bitirdi! Final skoru: {score}.',
  '60 dakikanın sonunda skor: {score}.',
];

// ---- Şablon seçme (tekrar koruması) ----
function fill(template: string, ctx: NarrationContext): string {
  return template
    .replaceAll('{minute}', `${ctx.minute}`)
    .replaceAll('{attacker}', ctx.attacker)
    .replaceAll('{helper}', ctx.helper)
    .replaceAll('{defender}', ctx.defender)
    .replaceAll('{gk}', ctx.gk)
    .replaceAll('{team}', ctx.team)
    .replaceAll('{opponent}', ctx.opponent)
    .replaceAll('{score}', ctx.score);
}

function pickFresh(rng: Rng, bank: string[], used: Set<string>): string {
  const fresh = bank.filter((t) => !used.has(t));
  const pool = fresh.length > 0 ? fresh : bank;
  const chosen = rng.pick(pool);
  used.add(chosen);
  return chosen;
}

export interface NarrationEngine {
  eventLines(type: MatchEventType, result: EventResult, ctx: NarrationContext): string[];
  halftimeLine(score: string): string;
  finalLine(score: string): string;
  /** Faul + (varsa) kart satırları */
  foulLines(ctx: NarrationContext, card: 'yellow' | 'red' | null, secondYellow: boolean): string[];
  /** Serbest vuruş: hazırlık + şut + gerilim + sonuç */
  freeKickLines(ctx: NarrationContext, result: EventResult): string[];
  /** Maç içi penaltı: karar + atış + sonuç */
  penaltyLines(ctx: NarrationContext, result: EventResult): string[];
  /** Sakatlık satırları */
  injuryLines(ctx: NarrationContext): string[];
  /** Oyuncu değişikliği satırı (helper=çıkan, attacker=giren) */
  subLines(ctx: NarrationContext): string[];
}

export function createNarrationEngine(rng: Rng): NarrationEngine {
  const used = new Set<string>();

  function buildup(type: MatchEventType, ctx: NarrationContext): string {
    const bank = buildupBank[type] ?? buildupBank['ara-pas'];
    return fill(pickFresh(rng, bank, used), ctx);
  }

  function action(type: MatchEventType, ctx: NarrationContext): string {
    // Perk tetiklendiyse perk'e özel satır önceliklidir (mekanik terim olmadan)
    for (const hint of ctx.perkHints) {
      const special = perkActionBank[hint];
      if (special && !used.has(special[0])) {
        used.add(special[0]);
        return fill(special[0], ctx);
      }
    }
    const bank = actionBank[type] ?? actionBank['plase'];
    return fill(pickFresh(rng, bank, used), ctx);
  }

  function suspense(rngLocal: Rng, close: boolean, ctx: NarrationContext): string {
    const bank = close ? suspenseBank.close : suspenseBank.generic;
    return fill(pickFresh(rngLocal, bank, used), ctx);
  }

  function resultLines(type: MatchEventType, result: EventResult, ctx: NarrationContext): string[] {
    switch (result) {
      case 'goal': {
        const stateBank = ctx.goalState ? goalBankByState[ctx.goalState] : [];
        const bank = rng.chance(0.55) && stateBank.length > 0 ? stateBank : goalBankNeutral;
        const lines = [fill(pickFresh(rng, bank, used), ctx)];
        if (rng.chance(0.5)) lines.push(fill(pickFresh(rng, equalizerOrLeadNote, used), ctx));
        return lines;
      }
      case 'save': {
        for (const hint of ctx.perkHints) {
          const special = perkSaveBank[hint];
          if (special) return [fill(special[0], ctx)];
        }
        return [fill(pickFresh(rng, saveBank, used), ctx)];
      }
      case 'miss':
        return [fill(pickFresh(rng, missBank, used), ctx)];
      case 'blocked': {
        for (const hint of ctx.perkHints) {
          const special = perkBlockBank[hint];
          if (special) return [fill(special[0], ctx)];
        }
        return [fill(pickFresh(rng, blockedBank, used), ctx)];
      }
      case 'corner-won':
        return [fill(pickFresh(rng, cornerBank, used), ctx)];
      case 'defended':
        return [fill(pickFresh(rng, defendedBank, used), ctx)];
      default:
        // Meta sonuçlar (faul/sakatlık/değişiklik) kendi satır üreticilerini kullanır
        return [];
    }
  }

  return {
    eventLines(type, result, ctx) {
      const lines: string[] = [buildup(type, ctx)];
      if (result === 'defended') {
        // Savunmada biten ataklar kısa anlatılır: hazırlık + sonuç
        lines.push(...resultLines(type, result, ctx));
        return lines;
      }
      lines.push(action(type, ctx));
      lines.push(suspense(rng, result === 'save' || result === 'goal', ctx));
      lines.push(...resultLines(type, result, ctx));
      return lines;
    },
    halftimeLine(score) {
      return pickFresh(rng, halftimeBank, used).replaceAll('{score}', score);
    },
    finalLine(score) {
      return pickFresh(rng, finalBank, used).replaceAll('{score}', score);
    },

    foulLines(ctx, card, secondYellow) {
      const lines = [fill(pickFresh(rng, foulBank, used), ctx)];
      if (card === 'yellow') {
        lines.push(fill(pickFresh(rng, yellowCardLines, used), ctx));
      } else if (card === 'red') {
        lines.push(fill(pickFresh(rng, secondYellow ? secondYellowLines : directRedLines, used), ctx));
      }
      return lines;
    },

    freeKickLines(ctx, result) {
      const lines = [
        fill(pickFresh(rng, freeKickSetupBank, used), ctx),
        fill(pickFresh(rng, freeKickShotBank, used), ctx),
      ];
      if (result === 'blocked') {
        lines.push(fill(pickFresh(rng, freeKickWallLines, used), ctx));
        return lines;
      }
      lines.push(fill(pickFresh(rng, suspenseBank.close, used), ctx));
      lines.push(...resultLines('serbest-vurus', result, ctx));
      return lines;
    },

    penaltyLines(ctx, result) {
      const lines = [
        fill(pickFresh(rng, penaltyCallLines, used), ctx),
        fill(`{attacker} topu noktaya dikti… Kaleci {gk} çizgide bekliyor.`, ctx),
        fill(pickFresh(rng, suspenseBank.close, used), ctx),
      ];
      lines.push(...resultLines('penalti', result, ctx));
      return lines;
    },

    injuryLines(ctx) {
      return [fill(pickFresh(rng, injuryBank, used), ctx), fill(pickFresh(rng, injuryExitLines, used), ctx)];
    },

    subLines(ctx) {
      return [fill(pickFresh(rng, subBank, used), ctx)];
    },
  };
}
