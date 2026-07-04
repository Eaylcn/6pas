import type { MatchEventType, Perk, Position } from '../types';

function perk(
  id: string,
  name: string,
  positionType: Position,
  description: string,
  triggerEvents: MatchEventType[],
  bonusType: Perk['bonusType'],
  bonusValue: number,
  counters: string[] = [],
  rarityWeight = 1,
): Perk {
  return {
    id,
    name,
    positionType,
    description,
    triggerEvents,
    bonusType,
    bonusValue,
    counters,
    rarityWeight,
    narrationHints: [id],
  };
}

// ---- ATAK PERKLERİ ----
export const atkPerks: Perk[] = [
  perk('bilek-kiran', 'Bilek Kıran', 'ATK', 'Dar alanda son anda bileğini çevirir, şut açısını kendisi yaratır.', ['calim', 'dar-aci', 'plase'], 'attack', 3),
  perk('dar-aci-ustasi', 'Dar Açı Ustası', 'ATK', 'İmkansız açılardan kaleyi bulur.', ['dar-aci', 'karsi-karsiya'], 'attack', 3),
  perk('olu-kose', 'Ölü Köşe', 'ATK', 'Uzaktan şutları köşelere çakılır.', ['uzaktan-sut', 'plase'], 'attack', 3),
  perk('rabona-imzasi', 'Rabona İmzası', 'ATK', 'Beklenmedik anda rabonaya başvurur.', ['rabona'], 'attack', 4, [], 0.7),
  perk('hava-fisegi', 'Hava Fişeği', 'ATK', 'Hava toplarında rakip savunmanın üstünde yükselir.', ['kafa', 'korner'], 'attack', 3),
  perk('tek-dokunus', 'Tek Dokunuş', 'ATK', 'Topu durdurmadan bitirir; kontrol için zamana ihtiyacı yok.', ['kontra', 'karsi-karsiya'], 'attack', 3),
  perk('savunma-arkasi', 'Savunma Arkası', 'ATK', 'Ofsayt çizgisiyle dans eder, arkaya sarkmayı koklar.', ['kontra', 'ara-pas'], 'attack', 3),
  perk('son-vurus', 'Son Vuruş', 'ATK', 'Maçın son anlarında soğukkanlılığı artar.', ['son-dakika'], 'attack', 4),
  perk('acimasiz-plase', 'Acımasız Plase', 'ATK', 'Sert vuruş yerine köşeye zehirli plase seçer.', ['plase', 'karsi-karsiya'], 'attack', 3),
  perk('kor-nokta-kosusu', 'Kör Nokta Koşusu', 'ATK', 'Savunmanın görmediği koridordan ceza sahasına sızar.', ['ara-pas', 'kafa'], 'attack', 3),
  perk('rovasata-tehdidi', 'Rövaşata Tehdidi', 'ATK', 'Havadaki her top onun için pozisyondur.', ['rovasata'], 'attack', 4, [], 0.7),
  perk('ayak-ici-zehri', 'Ayak İçi Zehri', 'ATK', 'Ayak içi vuruşları kaleciler için okunmazdır.', ['plase', 'dar-aci'], 'attack', 2),
  perk('kaleciyle-dans', 'Kaleciyle Dans', 'ATK', 'Karşı karşıya kaldığında paniklemez, kaleciyi oturtur.', ['karsi-karsiya'], 'attack', 4),
  perk('ilk-temas', 'İlk Temas', 'ATK', 'Topla ilk buluşması her zaman tehlike üretir.', ['calim', 'kontra'], 'attack', 2),
  perk('cift-vurus-sezgisi', 'Çift Vuruş Sezgisi', 'ATK', 'Dönen topa herkesten önce ulaşır.', ['korner', 'blok'], 'attack', 3),
];

// ---- ORTA SAHA PERKLERİ ----
export const midPerks: Perk[] = [
  perk('igne-deligi', 'İğne Deliği', 'MID', 'En dar boşluktan ara pası geçirir.', ['ara-pas'], 'playmaking', 4),
  perk('tempo-hirsizi', 'Tempo Hırsızı', 'MID', 'Oyunu yavaşlatıp rakibin ritmini çalar.', ['calim', 'ara-pas'], 'playmaking', 2),
  perk('kilit-pas', 'Kilit Pas', 'MID', 'Kilitli savunmaları tek pasla açar.', ['ara-pas', 'kontra'], 'playmaking', 3),
  perk('ucuncu-goz', 'Üçüncü Göz', 'MID', 'Görmeden pas verir; arkadaşlarının koşusunu hisseder.', ['ara-pas', 'ters-top'], 'playmaking', 3),
  perk('baskidan-cikis', 'Baskıdan Çıkış', 'MID', 'Pres altında topu asla kaybetmez.', ['calim', 'kontra'], 'playmaking', 3, ['pres-kiran']),
  perk('pas-muhendisi', 'Pas Mühendisi', 'MID', 'Pas haritası cetvelle çizilmiş gibidir.', ['ara-pas'], 'playmaking', 2),
  perk('saha-akli', 'Saha Aklı', 'MID', 'Nerede duracağını her zaman bilir; oyun ondan geçer.', ['ara-pas', 'ters-top'], 'playmaking', 2),
  perk('ters-top', 'Ters Top', 'MID', 'Herkes içeri beklerken dışarı açar; savunmayı ters köşeye yatırır.', ['ters-top'], 'playmaking', 3),
  perk('oyunun-nabzi', 'Oyunun Nabzı', 'MID', 'Maçın gidişatını okur, doğru anda hızlandırır.', ['son-dakika', 'kontra'], 'playmaking', 3),
  perk('dar-alan-ustasi', 'Dar Alan Ustası', 'MID', 'Kalabalıkta topla yaşar.', ['calim'], 'playmaking', 3),
  perk('onsezi-pasi', 'Önsezi Pası', 'MID', 'Koşu başlamadan pası atar.', ['ara-pas', 'kontra'], 'playmaking', 3),
  perk('sessiz-orkestra', 'Sessiz Orkestra', 'MID', 'Gösterişsizdir ama takım onunla çalar.', ['ara-pas'], 'playmaking', 2),
  perk('pres-kiran', 'Pres Kıran', 'MID', 'Rakip baskısını tek dokunuşla anlamsızlaştırır.', ['calim', 'ara-pas'], 'playmaking', 3),
  perk('ara-koridor', 'Ara Koridor', 'MID', 'Savunma ile orta saha arasındaki gri bölgede oynar.', ['ara-pas', 'uzaktan-sut'], 'playmaking', 2),
  perk('ikinci-top-avcisi', 'İkinci Top Avcısı', 'MID', 'Dönen topların tamamı onundur.', ['korner', 'blok', 'uzaktan-sut'], 'playmaking', 3),
];

// ---- DEFANS PERKLERİ ----
export const defPerks: Perk[] = [
  perk('son-perde', 'Son Perde', 'DEF', 'Gol olacak topu son anda perdeler.', ['karsi-karsiya', 'cizgiden'], 'defense', 4),
  perk('cizgi-supurucu', 'Çizgi Süpürücü', 'DEF', 'Çizgiden top çıkarmak onun işi.', ['cizgiden'], 'defense', 4),
  perk('omuz-omuza', 'Omuz Omuza', 'DEF', 'Fiziksel mücadelede asla geri adım atmaz.', ['calim', 'kafa'], 'defense', 3),
  perk('alan-kilidi', 'Alan Kilidi', 'DEF', 'Bölgesini kilitler; oradan geçiş yoktur.', ['ara-pas', 'ters-top'], 'defense', 3, ['igne-deligi']),
  perk('sut-sonduren', 'Şut Söndüren', 'DEF', 'Şut anında ayağı hep araya girer.', ['uzaktan-sut', 'blok', 'plase'], 'defense', 3, ['olu-kose', 'bilek-kiran']),
  perk('ters-kademe', 'Ters Kademe', 'DEF', 'Arkadaşının arkasını herkesten önce kapatır.', ['kontra', 'ara-pas'], 'defense', 3, ['savunma-arkasi']),
  perk('sessiz-mudahale', 'Sessiz Müdahale', 'DEF', 'Faulsüz, temiz, sessiz top çalar.', ['calim'], 'defense', 3),
  perk('duvar-etkisi', 'Duvar Etkisi', 'DEF', 'Önüne gelen her şutu gövdesiyle karşılar.', ['blok', 'uzaktan-sut'], 'defense', 3),
  perk('zamaninda-kayis', 'Zamanında Kayış', 'DEF', 'Kayarak müdahalede zamanlaması kusursuzdur.', ['kontra', 'dar-aci'], 'defense', 3),
  perk('govde-koydu', 'Gövde Koydu', 'DEF', 'Vücudunu koyar, pozisyonu öldürür.', ['karsi-karsiya', 'blok'], 'defense', 3),
  perk('hava-kilidi', 'Hava Kilidi', 'DEF', 'Hava toplarında geçilmez.', ['kafa', 'korner'], 'defense', 3, ['hava-fisegi']),
  perk('koridor-kapatan', 'Koridor Kapatan', 'DEF', 'İç koridorları kapatır, oyunu dışarı iter.', ['ara-pas', 'ters-top'], 'defense', 2),
  perk('risk-temizligi', 'Risk Temizliği', 'DEF', 'Riskli topu asla taşımaz; tehlikeyi anında temizler.', ['kontra', 'korner'], 'defense', 2),
  perk('son-adam', 'Son Adam', 'DEF', 'Son adam olarak hata yapmaz.', ['kontra', 'karsi-karsiya'], 'defense', 4),
  perk('temas-ustasi', 'Temas Ustası', 'DEF', 'Omuz temasında top hep ona kalır.', ['calim', 'kafa'], 'defense', 2),
];

// ---- KALECİ PERKLERİ ----
export const gkPerks: Perk[] = [
  perk('son-nefes-refleksi', 'Son Nefes Refleksi', 'GK', 'Bitti denilen topa son anda uzanır.', ['karsi-karsiya', 'plase', 'dar-aci'], 'save', 4),
  perk('kale-muhru', 'Kale Mührü', 'GK', 'İyi gününde kalesine gol girmez.', ['uzaktan-sut', 'plase'], 'save', 3),
  perk('cizgi-buyucusu', 'Çizgi Büyücüsü', 'GK', 'Çizgi üzerinde yaptığı kurtarışlar akıl almazdır.', ['kafa', 'rovasata', 'cizgiden'], 'save', 3),
  perk('yumruk-cikisi', 'Yumruk Çıkışı', 'GK', 'Ortalara yumrukla güven verir.', ['korner', 'kafa'], 'save', 3, ['hava-fisegi']),
  perk('panik-yok', 'Panik Yok', 'GK', 'Baskı altında bile soğukkanlı.', ['karsi-karsiya', 'son-dakika'], 'save', 3),
  perk('kontra-fitili', 'Kontra Fitili', 'GK', 'Kurtarıştan saniyeler içinde hücum başlatır.', ['kontra'], 'save', 2),
  perk('ucan-eldiven', 'Uçan Eldiven', 'GK', 'Üst köşelere uçarak uzanır.', ['uzaktan-sut', 'rabona'], 'save', 4, ['olu-kose']),
  perk('aci-katili', 'Açı Katili', 'GK', 'Açıyı öyle kapatır ki vurulacak yer kalmaz.', ['dar-aci', 'karsi-karsiya'], 'save', 4, ['dar-aci-ustasi']),
  perk('tek-el-mucizesi', 'Tek El Mucizesi', 'GK', 'Tek eliyle yaptığı kurtarışlar manşetlere çıkar.', ['plase', 'kafa'], 'save', 3),
  perk('karsi-karsiya-sogugu', 'Karşı Karşıya Soğuğu', 'GK', 'Karşı karşıya pozisyonlarda forvetin gözünün içine bakar.', ['karsi-karsiya'], 'save', 4, ['kaleciyle-dans']),
  perk('hava-sahasi', 'Hava Sahası', 'GK', 'Ceza sahasındaki her yüksek top onun malıdır.', ['korner', 'kafa'], 'save', 3),
  perk('direk-dibi', 'Direk Dibi', 'GK', 'Yakın direğini asla geçit vermez.', ['dar-aci', 'plase'], 'save', 3),
  perk('gozunu-kirpmadi', 'Gözünü Kırpmadı', 'GK', 'Sert şutlarda dahi gözünü topa diker.', ['uzaktan-sut'], 'save', 3),
  perk('ilk-hamle', 'İlk Hamle', 'GK', 'Karşı karşıyada ilk hamleyi hep o yapar.', ['karsi-karsiya', 'kontra'], 'save', 3),
  perk('eldiven-izi', 'Eldiven İzi', 'GK', 'Değdiği her top kaleden uzaklaşır.', ['plase', 'uzaktan-sut', 'dar-aci'], 'save', 2),
];

export const allPerks: Perk[] = [...atkPerks, ...midPerks, ...defPerks, ...gkPerks];

const perkMap = new Map(allPerks.map((p) => [p.id, p]));

export function getPerk(id: string): Perk | undefined {
  return perkMap.get(id);
}

export function perksForPosition(position: Position): Perk[] {
  switch (position) {
    case 'ATK':
      return atkPerks;
    case 'MID':
      return midPerks;
    case 'DEF':
      return defPerks;
    case 'GK':
      return gkPerks;
  }
}
