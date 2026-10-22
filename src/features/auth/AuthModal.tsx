import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'signin' }) => {
  const { signIn, signUp, signInAsGuest, isConfigured } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (tab === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        if (!username) {
          setError('Username is required');
          setSubmitting(false);
          return;
        }
        const res = await signUp(email, password, username);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setSubmitting(true);
    await signInAsGuest();
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">{tab === 'signin' ? 'Sign In' : 'Create Account'}</h3>
            <p className="modal-subtitle">
              {tab === 'signin' 
                ? 'Sign in to sync your verified scores and compete on the global leaderboard.' 
                : 'Join the waiting room and claim your official When Yah tag.'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {!isConfigured && (
          <div className="alert-notice warning">
            <AlertCircle size={16} />
            <span>Supabase backend not yet linked. You can test locally as a guest!</span>
          </div>
        )}

        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(null); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="alert-notice error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'signup' && (
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <div className="input-with-icon">
                <UserIcon size={18} className="input-icon" />
                <input
                  id="username"
                  type="text"
                  placeholder="yah_speedster"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? <Loader2 size={18} className="spin" /> : (tab === 'signin' ? 'Sign In' : 'Create Account')}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={handleGuest}
            disabled={submitting}
          >
            Continue as Guest
          </button>
        </form>
      </div>
    </div>
  );
};
