import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Share2, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  ExternalLink,
  Flame,
  Sparkles
} from 'lucide-react';
import { RunResult } from '../../types/typing';

interface ResultModalProps {
  result: RunResult | null;
  onClose: () => void;
  onRestart: () => void;
  onViewLeaderboard: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  onClose,
  onRestart,
  onViewLeaderboard,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Keyboard navigation: Tab / Enter restarts immediately, Escape closes
  useEffect(() => {
    if (!result) return;
    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        onRestart();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [result, onRestart, onClose]);

  const mascotReaction = useMemo(() => {
    if (!result) return { sprite: '/assets/character/yah-chan-idle.svg', title: 'Solid Effort!' };
    if (result.isPersonalBest || result.wpm >= 90) {
      return {
        sprite: '/assets/character/yah-chan-victory.svg',
        title: 'GODLIKE SPEED! 👑',
      };
    }
    if (result.wpm >= 60 || result.accuracy >= 96) {
      return {
        sprite: '/assets/character/yah-chan-cheer.svg',
        title: 'SUGOI! ON FIRE! ★',
      };
    }
    if (result.errors > 8 || result.accuracy < 85) {
      return {
        sprite: '/assets/character/yah-chan-panic.svg',
        title: 'DON\'T GIVE UP! 💢',
      };
    }
    return {
      sprite: '/assets/character/yah-chan-idle.svg',
      title: 'GREAT RUN! ♪',
    };
  }, [result]);

  if (!result) return null;

  // Humor caption
  let memeCaption = 'The waiting continues.';
  if (result.wpm >= 140) {
    memeCaption = 'Touch grass immediately. Your fingers have ascended past mortal realms.';
  } else if (result.wpm >= 110) {
    memeCaption = 'Certified When Yah Legend. The keyboard was begging for mercy.';
  } else if (result.wpm >= 80) {
    memeCaption = 'Your fingers. Your destiny. Speed is fiercely respectable.';
  } else if (result.wpm >= 50) {
    memeCaption = 'Ready to suffer? Practice makes faster. Keep rhythm!';
  } else {
    memeCaption = 'Skill issue detected. Wait harder.';
  }

  const shareText = `I survived ${result.duration}s of When Yah with ${result.wpm} WPM and ${result.accuracy}% accuracy (${result.phraseCount} When Yahs typed, max combo ${result.bestCombo || 0})! 💀\nPlay at: https://whenyahtype.netlify.app`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WhenYahType Results',
          text: shareText,
          url: 'https://whenyahtype.netlify.app',
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card result-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* PB Banner */}
        {result.isPersonalBest && (
          <div className="pb-banner">
            <Trophy size={16} />
            <span>NEW PERSONAL BEST RECORD!</span>
          </div>
        )}

        {/* Mascot & Score Showcase */}
        <div className="result-showcase-row">
          <div className="result-mascot-box">
            <img
              src={mascotReaction.sprite}
              alt="Yah-chan Reaction"
              className="result-mascot-img"
            />
            <div className="result-mascot-tag">
              <Sparkles size={11} className="text-arcade-gold" />
              <span>{mascotReaction.title}</span>
            </div>
          </div>

          <div className="result-hero-text">
            <div className="result-mode-tag">
              <span>{result.mode.toUpperCase()} · {result.duration}S ARCADE MATCH</span>
            </div>
            <h2 className="result-main-title">
              {result.wpm} <span className="unit">WPM</span>
            </h2>
            <p className="result-caption">"{memeCaption}"</p>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="result-verification-status">
          {result.status === 'validating' && (
            <div className="status-badge validating">
              <span className="dot pulse" />
              <span>Verifying keystroke evidence with server...</span>
            </div>
          )}
          {result.status === 'verified' && (
            <div className="status-badge verified">
              <ShieldCheck size={16} />
              <span>Verified Official Score · Saved to Global High-Score Board</span>
            </div>
          )}
          {result.status === 'rejected' && (
            <div className="status-badge rejected">
              <AlertTriangle size={16} />
              <span>{result.errorMessage || 'Server rejected score submission.'}</span>
            </div>
          )}
          {result.status === 'offline_saved' && (
            <div className="status-badge offline">
              <span>Guest Local Score Recorded · Sign in to compete on global ranks</span>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="result-grid">
          <div className="metric-box">
            <span className="metric-title">Accuracy</span>
            <span className="metric-val accent">{result.accuracy}%</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">Best Combo</span>
            <span className="metric-val combo-val">
              <Flame size={14} className="text-pink inline-icon" />
              {result.bestCombo ?? 0}
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-title">Raw WPM</span>
            <span className="metric-val">{result.rawWpm}</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">When Yahs</span>
            <span className="metric-val">{result.phraseCount}</span>
          </div>

          <div className="metric-box full-span">
            <span className="metric-title">Keystroke Breakdown</span>
            <span className="metric-val sm">
              <span className="correct-count">{result.correct} correct</span> /{' '}
              <span className="error-count">{result.errors} mistakes</span>
            </span>
          </div>
        </div>

        {/* New Achievements Awarded */}
        {result.unlockedAchievements && result.unlockedAchievements.length > 0 && (
          <div className="achievements-banner">
            <Award size={18} className="award-icon" />
            <div>
              <strong>Achievement Unlocked!</strong>
              <div className="achievement-tags">
                {result.unlockedAchievements.map((ach) => (
                  <span key={ach} className="achievement-pill">
                    {ach.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="result-actions">
          <button type="button" className="btn btn-primary" onClick={onRestart}>
            <RotateCcw size={16} />
            <span>Play Again</span>
            <kbd className="kbd-shortcut">Tab</kbd>
          </button>

          <button type="button" className="btn btn-secondary" onClick={handleNativeShare}>
            {copied ? <Check size={16} className="text-success" /> : <Share2 size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Share Result'}</span>
          </button>

          <button type="button" className="btn btn-ghost" onClick={onViewLeaderboard}>
            <ExternalLink size={16} />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
