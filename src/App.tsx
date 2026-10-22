import React, { useEffect, useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { TypingArena } from './features/typing/TypingArena';
import { LeaderboardView } from './features/leaderboard/LeaderboardView';
import { DailyChallengeView } from './features/daily-challenge/DailyChallengeView';
import { ProfileView } from './features/profile/ProfileView';
import { SettingsView } from './features/settings/SettingsView';
import { ResultModal } from './features/results/ResultModal';
import { AuthModal } from './features/auth/AuthModal';
import { AuthProvider } from './features/auth/AuthContext';
import { Duration, Mode, RunResult, TypingSettings } from './types/typing';
import { loadSettings } from './lib/storage';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('arena');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<TypingSettings>(loadSettings);

  const [mode, setMode] = useState<Mode>('classic');
  const [duration, setDuration] = useState<Duration>(30);
  const [latestResult, setLatestResult] = useState<RunResult | null>(null);

  // Sync hash with navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('profile/')) {
        const u = hash.replace('profile/', '');
        setSelectedUser(decodeURIComponent(u));
        setActiveTab('profile');
      } else if (['arena', 'leaderboard', 'daily', 'profile', 'settings'].includes(hash)) {
        setActiveTab(hash as NavTab);
        if (hash !== 'profile') setSelectedUser(null);
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (tab: NavTab, profileUsername?: string) => {
    setActiveTab(tab);
    if (tab === 'profile' && profileUsername) {
      setSelectedUser(profileUsername);
      window.location.hash = `profile/${encodeURIComponent(profileUsername)}`;
    } else {
      setSelectedUser(null);
      window.location.hash = tab === 'arena' ? '' : tab;
    }
  };

  const handleRunComplete = (res: RunResult) => {
    setLatestResult(res);
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => navigateTo(tab)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'arena' && (
          <TypingArena
            mode={mode}
            duration={duration}
            onDurationChange={setDuration}
            onModeChange={setMode}
            settings={settings}
            onRunComplete={handleRunComplete}
          />
        )}

        {activeTab === 'daily' && (
          <DailyChallengeView
            onStartChallenge={() => {
              setMode('daily');
              navigateTo('arena');
            }}
            onSelectUser={(u) => navigateTo('profile', u)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            onSelectUser={(u) => navigateTo('profile', u)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            targetUsername={selectedUser || undefined}
            onBack={() => navigateTo('arena')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}
      </main>

      <Footer />

      {/* Result Summary Modal */}
      <ResultModal
        result={latestResult}
        onClose={() => setLatestResult(null)}
        onRestart={() => setLatestResult(null)}
        onViewLeaderboard={() => {
          setLatestResult(null);
          navigateTo('leaderboard');
        }}
      />

      {/* Auth / Guest Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
