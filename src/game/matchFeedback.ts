// Maç sonu koçluk geri bildirimi: kaybedilen maçta olayları analiz edip
// "şunu yapsaydın kazanabilirdin" tarzı yapıcı öneriler üretir.
import type { MatchEvent, TeamMatchInfo } from '../types';
import type { SimTeamState } from './matchEngine';

export interface MatchFeedback {
  headline: string;
  tips: string[];
}

export function buildLossFeedback(
  home: SimTeamState,
  away: SimTeamState,
  events: MatchEvent[],
  wentToPens: boolean,
): MatchFeedback {
  const tips: string[] = [];
  const myEvents = events.filter((e) => e.attackingTeam === 'home');
  const oppEvents = events.filter((e) => e.attackingTeam === 'away');

  const myShots = myEvents.filter((e) => ['goal', 'save', 'miss'].includes(e.result)).length;
  const myGoals = home.goals;
  const concededSetPiece = events.filter(
    (e) => e.attackingTeam === 'away' && e.result === 'goal' && (e.setPiece === 'pen' || e.setPiece === 'fk'),
  ).length;
  const myReds = events.filter((e) => e.card === 'red' && e.defendingTeam === 'home').length;
  const chem = home.info.chemistry.score;
  const powerGap = away.info.power - home.info.power;

  // 1) Kimya
  if (chem < 55) {
    tips.push(
      `Takım kimyan düşüktü (${chem}/100). Aynı kulüp, lig ya da uyruktan oyuncuları bir araya getirsen kadron daha uyumlu oynardı.`,
    );
  }

  // 2) Güç farkı
  if (powerGap >= 4) {
    tips.push(
      `Rakip kâğıt üstünde senden güçlüydü (${away.info.power} - ${home.info.power}). Bu tür maçlarda defansif/kontra bir planla kaleni koruyup tek fırsatı değerlendirmek daha akıllıca.`,
    );
  }

  // 3) Şut isabeti / hücum üretimi
  if (myShots >= 5 && myGoals <= 1) {
    tips.push(`${myShots} şut çektin ama ${myGoals} gol çıktı. Uzaktan denemek yerine daha net pozisyonlar araman skoru değiştirebilirdi.`);
  } else if (myShots <= 2) {
    tips.push('Rakip kaleyi neredeyse hiç yoklamadın. Daha ofansif bir planla ya da kanatları kullanarak pozisyon üretmelisin.');
  }

  // 4) Duran toptan yenilen goller
  if (concededSetPiece >= 1) {
    tips.push('Yediğin gollerin bir kısmı duran toptan geldi. Ceza sahasında daha uzun/güçlü savunmacılar ve dikkatli müdahaleler bu golleri önler.');
  }

  // 5) Kırmızı kart
  if (myReds >= 1) {
    tips.push('Kırmızı kart seni eksik bıraktı. Sert müdahalelerde daha temkinli olmak (ya da riskli bölgede faul yapmamak) maçın gidişatını korurdu.');
  }

  // 6) Rakip taktiği
  if (away.info.defaultPlayStyle === 'ofansif' && home.info.defaultPlayStyle !== 'kontra') {
    tips.push('Rakip öne çıkıp risk aldı; buna karşı "Kontra" planı arkalarındaki boşluğu değerlendirmeni sağlardı.');
  }

  // Doldurucu: en az bir yapıcı not olsun
  if (tips.length === 0) {
    tips.push('İnce farklarla kaybettin. Devre arası ve kenara talimatta erken müdahale (değişiklik/taktik) dengeyi lehine çevirebilir.');
  }

  const headline = wentToPens
    ? 'Penaltılara kadar götürdün — az kalmıştı!'
    : powerGap >= 4
      ? 'Güçlü rakibe karşı zorlu bir maçtı.'
      : 'Bu maçı alabilirdin — işte nerede kaybettin.';

  return { headline, tips: tips.slice(0, 4) };
}
