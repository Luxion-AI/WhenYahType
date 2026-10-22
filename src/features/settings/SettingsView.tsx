import React, { useState } from 'react';
import { 
  User, 
  Volume2, 
  VolumeX, 
  Type, 
  Sliders, 
  Trash2, 
  LogOut, 
  Save, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { TypingSettings } from '../../types/typing';
import { saveSettings } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';

interface SettingsViewProps {
  settings: TypingSettings;
  onUpdateSettings: (newSettings: TypingSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const { username, isGuest, updateUsername, signOut, deleteAccount } = useAuth();

  const [desiredUsername, setDesiredUsername] = useState<string>(username);
  const [usernameMsg, setUsernameMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [savingUsername, setSavingUsername] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteInput, setDeleteInput] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameMsg(null);
    setSavingUsername(true);

    const res = await updateUsername(desiredUsername);
    if (res.error) {
      setUsernameMsg({ text: res.error, error: true });
    } else {
      setUsernameMsg({ text: 'Username updated successfully!', error: false });
    }
    setSavingUsername(false);
  };

  const handleSettingChange = <K extends keyof TypingSettings>(key: K, value: TypingSettings[K]) => {
    const next = { ...settings, [key]: value };
    onUpdateSettings(next);
    saveSettings(next);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }
    const res = await deleteAccount();
    if (res.error) {
      setDeleteError(res.error);
    } else {
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="section-header">
        <div className="section-title-group">
          <div className="title-with-icon">
            <Sliders className="accent-icon" size={24} />
            <h1 className="section-title">Preferences & Account</h1>
          </div>
          <p className="section-subtitle">
            Configure typing ergonomics, visual caret styles, audio feedback, and handle profile identity.
          </p>
        </div>
      </div>

      <div className="settings-cards-stack">
        {/* Profile Settings */}
        <div className="card settings-card">
          <div className="card-header">
            <User size={18} className="accent-icon" />
            <h3 className="card-title">Profile Identity</h3>
          </div>

          <form onSubmit={handleSaveUsername} className="settings-form">
            <div className="input-group">
              <label htmlFor="settings-username">Display / Tag Name</label>
              <div className="input-row">
                <input
                  id="settings-username"
                  type="text"
                  value={desiredUsername}
                  onChange={(e) => setDesiredUsername(e.target.value)}
                  placeholder="yah_master"
                  maxLength={25}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={savingUsername}>
                  <Save size={16} />
                  <span>Save</span>
                </button>
              </div>
              <span className="input-hint">
                {isGuest ? 'Changes apply locally for guest runs.' : 'Official name displayed on public leaderboards.'}
              </span>
            </div>

            {usernameMsg && (
              <div className={`alert-notice ${usernameMsg.error ? 'error' : 'success'}`}>
                {usernameMsg.error ? <AlertTriangle size={16} /> : <Check size={16} />}
                <span>{usernameMsg.text}</span>
              </div>
            )}
          </form>
        </div>

        {/* Audio Preferences */}
        <div className="card settings-card">
          <div className="card-header">
            {settings.soundEnabled ? <Volume2 size={18} className="accent-icon" /> : <VolumeX size={18} />}
            <h3 className="card-title">Tactile Audio Feedback</h3>
          </div>

          <div className="setting-row">
            <div className="setting-label-group">
              <strong>Mechanical Click Sounds</strong>
              <p className="setting-description">
                Subtle Web Audio synthesis for keystrokes, spaces, errors, and resets.
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>

          {settings.soundEnabled && (
            <div className="setting-row">
              <div className="setting-label-group">
                <strong>Volume</strong>
                <p className="setting-description">Adjust mechanical sound gain level.</p>
              </div>
              <div className="volume-slider-group">
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => handleSettingChange('soundVolume', parseFloat(e.target.value))}
                />
                <span className="volume-val">{Math.round(settings.soundVolume * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Typing Ergonomics & Typography */}
        <div className="card settings-card">
          <div className="card-header">
            <Type size={18} className="accent-icon" />
            <h3 className="card-title">Typing Ergonomics</h3>
          </div>

          {/* Font Size */}
          <div className="setting-row">
            <div className="setting-label-group">
              <strong>Font Scale</strong>
              <p className="setting-description">Size of the typing monospace text stream.</p>
            </div>
            <div className="segmented-control">
              {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`seg-btn ${settings.fontSize === sz ? 'active' : ''}`}
                  onClick={() => handleSettingChange('fontSize', sz)}
                >
                  {sz.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Caret Style */}
          <div className="setting-row">
            <div className="setting-label-group">
              <strong>Caret Indicator</strong>
              <p className="setting-description">Visual representation of your current typing cursor.</p>
            </div>
            <div className="segmented-control">
              {(['line', 'block', 'underline', 'off'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`seg-btn ${settings.caretStyle === style ? 'active' : ''}`}
                  onClick={() => handleSettingChange('caretStyle', style)}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Account Management & Deletion */}
        <div className="card settings-card danger-zone">
          <div className="card-header">
            <Trash2 size={18} className="text-danger" />
            <h3 className="card-title text-danger">Account Actions</h3>
          </div>

          <div className="setting-row">
            <div className="setting-label-group">
              <strong>Sign Out</strong>
              <p className="setting-description">Disconnect your authenticated account on this device.</p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => signOut()}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>

          {!isGuest && (
            <div className="setting-row border-top-danger pt-4 mt-2">
              <div className="setting-label-group">
                <strong className="text-danger">Delete Account & Scores</strong>
                <p className="setting-description">
                  Permanently wipe your profile and remove all verified typing records from the leaderboard.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title text-danger">Confirm Account Deletion</h3>
            </div>
            <p className="modal-subtitle">
              This action is permanent and cannot be undone. All your verified personal bests and leaderboard records will be deleted immediately.
            </p>

            <div className="input-group mt-4">
              <label htmlFor="delete-confirm-input">Type <strong>DELETE</strong> to confirm:</label>
              <input
                id="delete-confirm-input"
                type="text"
                placeholder="DELETE"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                autoFocus
              />
            </div>

            {deleteError && (
              <div className="alert-notice error mt-2">
                <AlertTriangle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="modal-actions mt-4">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setDeleteConfirmOpen(false); setDeleteError(null); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE'}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
