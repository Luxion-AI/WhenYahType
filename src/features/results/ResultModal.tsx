import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Share2, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  ExternalLink
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

  if (!result) return null;

  // Humor caption
  let memeCaption = 'The waiting continues.';
  if (result.wpm >= 140) {
    memeCaption = 'Touch grass immediately. Your fingers have ascended.';
  } else if (result.wpm >= 110) {
    memeCaption = 'Certified When Yah Enjoyer. Top tier pacing.';
  } else if (result.wpm >= 80) {
    memeCaption = 'Your fingers. Your destiny. Speed is respectable.';
  } else if (result.wpm >= 50) {
    memeCaption = 'Ready to suffer? Practice makes faster.';
  } else {
    memeCaption = 'Skill issue detected. Wait harder.';
  }

  const shareText = `I survived ${result.duration}s of When Yah with ${result.wpm} WPM and ${result.accuracy}% accuracy (${result.phraseCount} When Yahs typed)! 💀\nPlay at: https://whenyahtype.netlify.app`;

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
        {/* Header */}
        <div className="result-header">
          {result.isPersonalBest && (
            <div className="pb-banner">
              <Trophy size={16} />
              <span>NEW PERSONAL BEST!</span>
            </div>
          )}

          <h2 className="result-main-title">
            {result.wpm} <span className="unit">WPM</span>
          </h2>
          <p className="result-caption">"{memeCaption}"</p>
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
              <span>Verified Official Score · Saved to Global Leaderboard</span>
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
              <span>Local Score Recorded · Sign in to compete globally</span>
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
            <span className="metric-title">Raw WPM</span>
            <span className="metric-val">{result.rawWpm}</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">Characters</span>
            <span className="metric-val">
              <span className="correct-count">{result.correct}</span> /{' '}
              <span className="error-count">{result.errors}</span>
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-title">When Yahs</span>
            <span className="metric-val">{result.phraseCount}</span>
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
