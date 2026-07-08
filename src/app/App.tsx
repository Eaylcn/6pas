import { useEffect } from 'react';
import { NewspaperShell } from '../components/NewspaperShell';
import { useGameStore } from '../store/useGameStore';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeDashboard } from '../screens/HomeDashboard';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { TeamNameScreen } from '../screens/TeamNameScreen';
import { FormationSelectScreen } from '../screens/FormationSelectScreen';
import { TacticsSetupScreen } from '../screens/TacticsSetupScreen';
import { DraftScreen } from '../screens/DraftScreen';
import { SquadReviewScreen } from '../screens/SquadReviewScreen';
import { MatchmakingScreen } from '../screens/MatchmakingScreen';
import { MatchSimulationScreen } from '../screens/MatchSimulationScreen';
import { HalfTimeScreen } from '../screens/HalfTimeScreen';
import { MatchResultScreen } from '../screens/MatchResultScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { BracketScreen } from '../screens/BracketScreen';
import { ReinforcementScreen } from '../screens/ReinforcementScreen';
import { t } from '../i18n';

/** Ekran state-machine router'ı — ileride URL tabanlı router'a taşınabilir */
function Router() {
  const screen = useGameStore((s) => s.screen);
  switch (screen) {
    case 'login':
      return <LoginScreen />;
    case 'home':
      return <HomeDashboard />;
    case 'mode-select':
      return <ModeSelectScreen />;
    case 'team-name':
      return <TeamNameScreen />;
    case 'formation':
      return <FormationSelectScreen />;
    case 'tactics':
      return <TacticsSetupScreen />;
    case 'draft':
      return <DraftScreen />;
    case 'squad-review':
      return <SquadReviewScreen />;
    case 'matchmaking':
      return <MatchmakingScreen />;
    case 'match':
      return <MatchSimulationScreen />;
    case 'half-time':
      return <HalfTimeScreen />;
    case 'match-result':
      return <MatchResultScreen />;
    case 'leaderboard':
      return <LeaderboardScreen />;
    case 'bracket':
      return <BracketScreen />;
    case 'reinforcement':
      return <ReinforcementScreen />;
  }
}

export function App() {
  const init = useGameStore((s) => s.init);
  const booting = useGameStore((s) => s.booting);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    void init();
  }, [init]);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-score uppercase tracking-widest text-ink-soft animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  const wide = screen === 'draft' || screen === 'squad-review';
  return (
    <NewspaperShell wide={wide}>
      <Router />
    </NewspaperShell>
  );
}
