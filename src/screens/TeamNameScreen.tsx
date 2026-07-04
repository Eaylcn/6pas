import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useGameStore } from '../store/useGameStore';

export function TeamNameScreen() {
  const { draftTeamName, setTeamName, suggestTeamName, goto } = useGameStore();

  return (
    <div className="max-w-md mx-auto">
      <SectionHeadline sub={t('teamName.sub')}>{t('teamName.headline')}</SectionHeadline>
      <div className="news-card p-5 space-y-4">
        <input
          className="field-input font-headline font-bold text-xl"
          placeholder={t('teamName.placeholder')}
          value={draftTeamName}
          maxLength={28}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <button className="btn-outline w-full" onClick={suggestTeamName}>
          🎲 {t('teamName.randomize')}
        </button>
        <button
          className="btn-press w-full"
          disabled={draftTeamName.trim().length < 3}
          onClick={() => goto('formation')}
        >
          {t('teamName.continue')}
        </button>
      </div>
      <button className="btn-outline w-full mt-4" onClick={() => goto('mode-select')}>
        {t('common.back')}
      </button>
    </div>
  );
}
