import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useGameStore } from '../store/useGameStore';

export function ModeSelectScreen() {
  const goto = useGameStore((s) => s.goto);
  const startDraftFlow = useGameStore((s) => s.startDraftFlow);

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeadline>{t('mode.headline')}</SectionHeadline>
      <div className="space-y-3">
        <button className="news-card-clickable w-full p-5 text-left" onClick={() => startDraftFlow('classic')}>
          <div className="font-headline font-bold text-xl">{t('mode.classic')}</div>
          <p className="text-sm text-ink-soft mt-1">{t('mode.classicDesc')}</p>
        </button>
        <button className="news-card-clickable w-full p-5 text-left" onClick={() => startDraftFlow('tournament')}>
          <div className="font-headline font-bold text-xl">🏆 {t('mode.tournament')}</div>
          <p className="text-sm text-ink-soft mt-1">
            Son 32'den finale uzanan kupa yolu. Her tur tek maç, kaybeden evine döner; tur ilerledikçe rakipler
            sertleşir. Kupayı kaldıran, turnuva tablosuna adını yazdırır.
          </p>
        </button>
        <button className="news-card-clickable w-full p-5 text-left" onClick={() => startDraftFlow('career')}>
          <div className="font-headline font-bold text-xl">💪 Kariyer — Ana Kadro</div>
          <p className="text-sm text-ink-soft mt-1">
            Zayıf bir kadroyla başla, kalıcı takımını kur. Her galibiyette bir mevkiye takviye yap (eski oyuncu
            gider). Kaybetsen de kadron dağılmaz — sabırla bir ekol inşa et.
          </p>
        </button>
        <div className="news-card w-full p-5 text-left opacity-50">
          <div className="flex items-center justify-between">
            <div className="font-headline font-bold text-xl">{t('mode.ranked')}</div>
            <span className="tag-label">{t('common.comingSoon')}</span>
          </div>
        </div>
      </div>
      <button className="btn-outline w-full mt-5" onClick={() => goto('home')}>
        {t('common.back')}
      </button>
    </div>
  );
}
