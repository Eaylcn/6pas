// Yardımcı antrenör: gidişata göre öneri üretir (devre arası + kenara talimat).
// Öneriler tek tıkla uygulanabilir — action alanı store aksiyonlarına çevrilir.
import type { FieldPlayer, FieldPosition, MatchEvent, TacticalPlan } from '../types';
import { isGoalkeeper } from '../types';
import type { MatchSim } from './matchEngine';
import { computeMatchRatings } from './ratingsEngine';
import { MAX_SUBSTITUTIONS } from './halftimeEngine';

export interface AssistantAction {
  kind: 'sub' | 'plan' | 'position';
  /** kind=sub */
  outId?: string;
  inId?: string;
  /** kind=plan */
  plan?: Partial<TacticalPlan>;
  /** kind=position */
  playerId?: string;
  newPos?: FieldPosition;
}

export interface AssistantAdvice {
  text: string;
  /** null → sadece yorum (uygulanacak bir şey yok) */
  action: AssistantAction | null;
  applyLabel?: string;
}

/** Kullanıcı takımı (home) için en fazla 3 öneri */
export function getAssistantAdvice(sim: MatchSim, events: MatchEvent[]): AssistantAdvice[] {
  const home = sim.home;
  const away = sim.away;
  const out: AssistantAdvice[] = [];
  const diff = home.goals - away.goals;
  const field = home.info.players.filter((p): p is FieldPlayer => !isGoalkeeper(p));
  const subsLeft = MAX_SUBSTITUTIONS - home.subsUsed;
  const benchField = home.info.bench.filter((p): p is FieldPlayer => !isGoalkeeper(p));
  const plan = home.info.tacticalPlan;
  const count = (pos: FieldPosition) => field.filter((p) => p.position === pos).length;

  // 1) Eksik oyuncu (kırmızı / değişiklik hakkı bitmiş sakatlık): hat dengesi
  if (field.length < 5) {
    if (count('DEF') <= 1 && count('MID') >= 2) {
      const candidate = [...field].filter((p) => p.position === 'MID').sort((a, b) => b.def - a.def)[0];
      if (candidate) {
        out.push({
          text: `Eksik kaldık başkan. ${candidate.name} orta sahadan savunmaya çekilsin, arkayı kapatalım.`,
          action: { kind: 'position', playerId: candidate.id, newPos: 'DEF' },
          applyLabel: 'Savunmaya çek',
        });
      }
    } else if (count('DEF') === 0 && count('ATK') >= 1) {
      const candidate = [...field].filter((p) => p.position === 'ATK').sort((a, b) => b.def - a.def)[0];
      if (candidate) {
        out.push({
          text: `Savunmasız kaldık! ${candidate.name} geriye çekilip savunmaya yardım etsin.`,
          action: { kind: 'position', playerId: candidate.id, newPos: 'DEF' },
          applyLabel: 'Geriye çek',
        });
      }
    }
    if (diff >= 0 && (plan.whenWinning !== 'defansif' || plan.whenDrawing !== 'defansif')) {
      out.push({
        text: 'Bir kişi eksiğiz; temkinli oynayıp skoru koruyalım, boş alan bırakmayalım.',
        action: { kind: 'plan', plan: { whenWinning: 'defansif', whenDrawing: 'defansif' } },
        applyLabel: 'Temkinli plan',
      });
    }
  }

  // 2) Skor durumuna göre plan önerisi
  if (diff < 0) {
    if (plan.whenLosing !== 'ofansif') {
      out.push({
        text: 'Geriye düştük; kaybedecek bir şeyimiz yok, riski artırıp yüklenelim derim.',
        action: { kind: 'plan', plan: { whenLosing: 'ofansif' } },
        applyLabel: 'Yüklen',
      });
    } else if (out.length === 0) {
      out.push({ text: 'Plan doğru, yüklenmeye devam. Bir gol her şeyi değiştirir.', action: null });
    }
  } else if (diff === 0) {
    if (away.info.defaultPlayStyle === 'ofansif' && plan.whenDrawing !== 'kontra') {
      out.push({
        text: 'Rakip yüklenmeyi seviyor; beraberlikte kontraya dönersek arkalarında boş alan buluruz.',
        action: { kind: 'plan', plan: { whenDrawing: 'kontra' } },
        applyLabel: 'Kontraya geç',
      });
    } else if (out.length === 0) {
      out.push({ text: 'Maç dengede başkan. Sabırlı olalım; hata yapmayan kazanır.', action: null });
    }
  } else if (diff === 1) {
    if (plan.whenWinning !== 'defansif') {
      out.push({
        text: 'Tek gollük üstünlük kırılgandır; öndeyken biraz kapanıp skoru koruyalım.',
        action: { kind: 'plan', plan: { whenWinning: 'defansif' } },
        applyLabel: 'Skoru koru',
      });
    } else {
      out.push({ text: 'Önde ve kontrollüyüz; bu düzeni bozmayalım.', action: null });
    }
  } else {
    out.push({
      text: `Harika gidiyoruz başkan, ${diff} fark var! Tempoyu koruyalım, gereksiz risk almayalım.`,
      action: null,
    });
  }

  // 3) Formsuz oyuncu: aynı pozisyondan taze isim önerisi
  if (subsLeft > 0 && benchField.length > 0) {
    const ratings = computeMatchRatings(events, home, 'home').filter(
      (r) => !isGoalkeeper(r.player) && field.some((f) => f.id === r.player.id),
    );
    const worst = ratings[ratings.length - 1];
    if (worst && worst.rating < 6.0) {
      const wp = worst.player as FieldPlayer;
      const sub = benchField.filter((b) => b.position === wp.position).sort((a, b) => b.ovr - a.ovr)[0];
      if (sub) {
        out.push({
          text: `${wp.name} bugün istediğini bulamadı (${worst.rating.toFixed(1)}). ${sub.name} taze kan getirir.`,
          action: { kind: 'sub', outId: wp.id, inId: sub.id },
          applyLabel: 'Değişikliği yap',
        });
      }
    }
  }

  return out.slice(0, 3);
}
