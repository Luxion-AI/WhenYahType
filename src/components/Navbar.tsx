import React from 'react';
import { 
  Keyboard, 
  Trophy, 
  Flame, 
  User, 
  Sliders, 
  LogIn,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

export type NavTab = 'arena' | 'leaderboard' | 'daily' | 'profile' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenAuth: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  onNavigate, 
  onOpenAuth,
  soundEnabled = true,
  onToggleSound,
}) => {
  const { user, username, isGuest, isConfigured } = useAuth();

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand Logo */}
        <button
          type="button"
          className="brand-logo-btn"
          onClick={() => onNavigate('arena')}
          aria-label="WhenYahType Home"
        >
          <div className="brand-logo-icon">
            <svg viewBox="0 0 64 64" width="28" height="28">
              <rect width="64" height="64" rx="14" fill="#141824" />
              <path
                d="M19 22 L24 37 L29 22 L32 22 L37 37 L42 22"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="22" y="44" width="20" height="4" rx="2" fill="#fbbf24" />
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">WhenYahType</span>
            <span className="brand-tagline">Type fast. Wait harder.</span>
          </div>
        </button>

        {/* Main Navigation Links */}
        <nav className="nav-menu" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link ${activeTab === 'arena' ? 'active' : ''}`}
            onClick={() => onNavigate('arena')}
          >
            <Keyboard size={16} />
            <span>Arena</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => onNavigate('daily')}
          >
            <Flame size={16} className="accent-icon" />
            <span>Daily</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onNavigate('leaderboard')}
          >
            <Trophy size={16} />
            <span>Leaderboard</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => onNavigate('profile')}
          >
            <User size={16} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            <Sliders size={16} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right Action: Auth & Status */}
        <div className="nav-actions">
          {/* Sound Mute/Unmute Toggle */}
          {onToggleSound && (
            <button
              type="button"
              className="btn-pixel-icon sound-quick-toggle"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Audio Effects' : 'Enable Audio Effects'}
              aria-label={soundEnabled ? 'Mute Audio Effects' : 'Enable Audio Effects'}
            >
              {soundEnabled ? <Volume2 size={13} className="text-arcade-gold" /> : <VolumeX size={13} />}
            </button>
          )}

          {/* Supabase backend status pill */}
          <div className="status-indicator-pill" title={isConfigured ? 'Supabase backend connected' : 'Local storage mode'}>
            <span className={`status-dot ${isConfigured ? 'connected' : 'offline'}`} />
            <span className="status-label">{isConfigured ? 'Live' : 'Local'}</span>
          </div>

          {/* User / Sign In Button */}
          {user && !isGuest ? (
            <button
              type="button"
              className="user-badge-btn"
              onClick={() => onNavigate('profile')}
            >
              <div className="user-avatar-mini">
                <User size={14} />
              </div>
              <span className="user-name-text">{username}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm signin-btn"
              onClick={onOpenAuth}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
