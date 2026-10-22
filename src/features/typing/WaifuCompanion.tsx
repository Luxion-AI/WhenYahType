import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  Columns, 
  Rows, 
  Image as ImageIcon, 
  Flame, 
  Heart, 
  RefreshCw,
  Maximize,
  Minimize,
  Search
} from 'lucide-react';
import { BooruWaifu, CURATED_WAIFUS } from '../../lib/booru';
import { WaifuSearchModal } from './WaifuSearchModal';

export type CompanionEmotion = 'idle' | 'cheer' | 'panic' | 'victory';
export type LayoutMode = 'auto' | 'side-by-side' | 'up-by-low';
export type FitMode = 'contain' | 'cover';

interface WaifuCompanionProps {
  isRunning: boolean;
  isFinished: boolean;
  wpm: number;
  accuracy: number;
  errors: number;
  phraseCount: number;
  combo?: number;
  bestCombo?: number;
  isPersonalBest?: boolean;
}

export const WaifuCompanion: React.FC<WaifuCompanionProps> = ({
  isRunning,
  isFinished,
  wpm,
  accuracy,
  errors,
  phraseCount,
  combo = 0,
  bestCombo = 0,
  isPersonalBest = false,
}) => {
  // Companion Mode: 'booru' (dynamic external anime illustration) vs 'mascot' (local pixel Yah-chan)
  const [companionMode, setCompanionMode] = useState<'booru' | 'mascot'>('booru');

  // Currently active waifu (persisted in localStorage)
  const [activeWaifu, setActiveWaifu] = useState<BooruWaifu>(() => {
    try {
      const saved = localStorage.getItem('wyt_selected_waifu_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.url) return parsed;
      }
    } catch {
      // Ignore
    }
    return CURATED_WAIFUS[0];
  });

  const [visible, setVisible] = useState<boolean>(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [layoutOverride, setLayoutOverride] = useState<LayoutMode>('auto');
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [detectedOrientation, setDetectedOrientation] = useState<'portrait' | 'landscape'>(
    activeWaifu.orientation || 'landscape'
  );

  const prevErrorsRef = useRef<number>(errors);
  const [recentErrorPanic, setRecentErrorPanic] = useState<boolean>(false);

  // Sync orientation whenever active waifu changes
  useEffect(() => {
    if (activeWaifu.orientation) {
      setDetectedOrientation(activeWaifu.orientation);
    }
  }, [activeWaifu]);

  // Detect sudden error surge to trigger momentary panic emotion
  useEffect(() => {
    if (errors > prevErrorsRef.current) {
      setRecentErrorPanic(true);
      const timer = window.setTimeout(() => setRecentErrorPanic(false), 900);
      prevErrorsRef.current = errors;
      return () => window.clearTimeout(timer);
    }
    prevErrorsRef.current = errors;
  }, [errors]);

  // Determine Yah-chan's active emotion
  const emotion: CompanionEmotion = useMemo(() => {
    if (isFinished) {
      if (isPersonalBest || wpm >= 75 || accuracy >= 95) return 'victory';
      if (errors > 8 || accuracy < 85) return 'panic';
      return 'cheer';
    }

    if (isRunning) {
      if (recentErrorPanic) return 'panic';
      if (combo >= 25 || wpm >= 85) return 'cheer';
      return 'idle';
    }

    return 'idle';
  }, [isFinished, isRunning, isPersonalBest, wpm, accuracy, errors, recentErrorPanic, combo]);

  // Sprite mapping for local original mascot
  const mascotSpriteUrl = useMemo(() => {
    switch (emotion) {
      case 'cheer':
        return '/assets/character/yah-chan-cheer.svg';
      case 'panic':
        return '/assets/character/yah-chan-panic.svg';
      case 'victory':
        return '/assets/character/yah-chan-victory.svg';
      case 'idle':
      default:
        return '/assets/character/yah-chan-idle.svg';
    }
  }, [emotion]);

  // Image load handler to detect actual rendered aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      const isPort = naturalHeight > naturalWidth * 1.06;
      setDetectedOrientation(isPort ? 'portrait' : 'landscape');
    }
  };

  // Determine effective layout:
  // "kalau image nya potrait buat side by side kalau gmabarnya landscape itu up by low"
  const effectiveLayout: 'side-by-side' | 'up-by-low' = useMemo(() => {
    if (layoutOverride === 'side-by-side') return 'side-by-side';
    if (layoutOverride === 'up-by-low') return 'up-by-low';

    if (companionMode === 'mascot') {
      return 'side-by-side';
    }
    return detectedOrientation === 'portrait' ? 'side-by-side' : 'up-by-low';
  }, [layoutOverride, detectedOrientation, companionMode]);

  // Emotion badges and status subtitles
  const emotionBadge = useMemo(() => {
    switch (emotion) {
      case 'cheer':
        return { label: 'ON FIRE! ★', colorClass: 'badge-cheer' };
      case 'panic':
        return { label: 'SWEATING! 💢', colorClass: 'badge-panic' };
      case 'victory':
        return { label: 'VICTORY! 👑', colorClass: 'badge-victory' };
      case 'idle':
      default:
        return { label: 'CHEERING ♪', colorClass: 'badge-idle' };
    }
  }, [emotion]);

  // Dynamic dialogue reacting to the arcade match
  const dialogue = useMemo(() => {
    if (isFinished) {
      if (isPersonalBest) {
        return `YATTAAA!! 👑 NEW PERSONAL BEST! ${wpm} WPM! You are an absolute typing god, runner-sama!`;
      }
      if (wpm >= 110) {
        return `ANATA WA KAMI KA?! 🔥 ${wpm} WPM! Superhuman speed! Certified When Yah Legend!`;
      }
      if (wpm >= 80) {
        return `Otsukaresama! ${wpm} WPM with a best combo of ${bestCombo}! Blistering fast! ✨`;
      }
      if (wpm >= 50) {
        return `Sugoi! ${phraseCount} When Yahs delivered! Your keyboard discipline is solid! 💪`;
      }
      return "Ganbare! Don't let your memes be dreams. Press [TAB] and let's go again! 💕";
    }

    if (isRunning) {
      if (recentErrorPanic) {
        return "AWAWAWA! 💢 Typo alert! Don't lose your composure, breathe and find the groove!";
      }
      if (combo >= 50) {
        return `UNSTOPPABLE! 🔥 ${combo} COMBO STREAK! The keyboard is literally glowing!`;
      }
      if (combo >= 25) {
        return `YAH RHYTHM ACTIVATED! ⚡ ${combo} streak! Keep the tempo flowing!`;
      }
      if (wpm >= 90) {
        return `H-HAYAI!! ${wpm} WPM?! Your fingers are a blur of light! ⚡`;
      }
      if (wpm >= 60) {
        return `Nice pace! ${phraseCount} When Yahs conquered so far, stay in the zone! ✨`;
      }
      return "Type fast, wait harder! The high-score table is calling! 🌟";
    }

    return "Ganbatte, runner-kun! Type 'When Yah' to ignite the arcade! Tab to quick-restart anytime! 💕";
  }, [isFinished, isRunning, recentErrorPanic, combo, bestCombo, wpm, phraseCount, isPersonalBest]);

  // Quick Reroll: cycle to next curated waifu
  const handleReroll = () => {
    const currentIndex = CURATED_WAIFUS.findIndex((w) => w.url === activeWaifu.url);
    const nextIndex = (currentIndex + 1) % CURATED_WAIFUS.length;
    const nextWaifu = CURATED_WAIFUS[nextIndex];
    setActiveWaifu(nextWaifu);
    setDetectedOrientation(nextWaifu.orientation);
    try {
      localStorage.setItem('wyt_selected_waifu_v1', JSON.stringify(nextWaifu));
    } catch {
      // Ignore
    }
  };

  // Cycle layout override: auto -> side-by-side -> up-by-low -> auto
  const cycleLayout = () => {
    if (layoutOverride === 'auto') setLayoutOverride('side-by-side');
    else if (layoutOverride === 'side-by-side') setLayoutOverride('up-by-low');
    else setLayoutOverride('auto');
  };

  if (!visible) {
    return (
      <div className="companion-collapsed-strip">
        <button
          type="button"
          className="btn-pixel btn-pixel-sm companion-toggle-btn"
          onClick={() => setVisible(true)}
          title="Summon Companion Cheerleader"
        >
          <Eye size={12} />
          <span>[ CHEERLEADER ON ]</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`companion-stage layout-${effectiveLayout} fit-${fitMode} emotion-${emotion}`}
        data-orientation={detectedOrientation}
      >
        {/* Visual Character Frame (GIANT DISPLAY) */}
        <div className="companion-portrait-frame">
          <div className="companion-pixel-border">
            {/* Pixel Corner Studs */}
            <div className="pixel-corner corner-tl" />
            <div className="pixel-corner corner-tr" />
            <div className="pixel-corner corner-bl" />
            <div className="pixel-corner corner-br" />

            {/* Character Art Display */}
            {companionMode === 'mascot' ? (
              <div className={`mascot-sprite-container emotion-${emotion}`}>
                <img
                  src={mascotSpriteUrl}
                  alt={`Yah-chan Cheerleader (${emotion})`}
                  className="mascot-pixel-img"
                  loading="eager"
                  draggable={false}
                  onLoad={handleImageLoad}
                />
                <div className="mascot-nameplate">
                  <Heart size={11} className="heart-pulse text-waifu" />
                  <span>YAH-CHAN</span>
                  <span className={`status-pill-mini ${emotionBadge.colorClass}`}>{emotionBadge.label}</span>
                </div>
              </div>
            ) : (
              <div className="external-waifu-container">
                {/* Ambient blurred backdrop for letterbox areas */}
                <div
                  className="external-avatar-backdrop"
                  style={{ backgroundImage: `url(${activeWaifu.url})` }}
                />

                <img
                  src={activeWaifu.url}
                  alt={activeWaifu.name}
                  className={`external-avatar-img fit-${fitMode}`}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== CURATED_WAIFUS[0].url) {
                      target.src = CURATED_WAIFUS[0].url;
                    }
                  }}
                />
                <div className="mascot-nameplate">
                  <Heart size={11} className="heart-pulse text-waifu" />
                  <span>{activeWaifu.name}</span>
                  <span className="source-label">
                    [{activeWaifu.source}] · {detectedOrientation.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Teks Penyemangat & Command Deck (Positioned below image in landscape, side-by-side in portrait) */}
        <div className="companion-dialogue-deck">
          <div className="deck-header-row">
            <div className="deck-title-tag">
              <Sparkles size={13} className="text-arcade-gold" />
              <span className="deck-tag-text">
                {companionMode === 'mascot' ? '★ ARCADE CHEERLEADER ★' : '★ WAIFU COMPANION ★'}
              </span>
            </div>

            {/* Quick Arcade Controls */}
            <div className="deck-controls">
              {/* Search & Choose Waifu Button */}
              <button
                type="button"
                className="btn-pixel-icon btn-search-waifu"
                onClick={() => setIsSearchModalOpen(true)}
                title="Search and choose your waifu companion from booru library"
              >
                <Search size={13} className="text-arcade-gold" />
                <span className="btn-label-text">CHOOSE WAIFU</span>
              </button>

              {/* Reroll Button */}
              {companionMode === 'booru' && (
                <button
                  type="button"
                  className="btn-pixel-icon"
                  onClick={handleReroll}
                  title="Cycle to next waifu"
                >
                  <RefreshCw size={13} />
                  <span className="btn-label-text">REROLL</span>
                </button>
              )}

              {/* Mode Toggle: Booru vs Pixel */}
              <button
                type="button"
                className={`btn-pixel-icon ${companionMode === 'booru' ? 'btn-active' : ''}`}
                onClick={() => setCompanionMode(companionMode === 'booru' ? 'mascot' : 'booru')}
                title={companionMode === 'booru' ? 'Switch to Pixel Yah-chan' : 'Switch to High-Res Waifu Art'}
              >
                <ImageIcon size={13} />
                <span className="btn-label-text">
                  {companionMode === 'booru' ? 'BOORU' : 'PIXEL'}
                </span>
              </button>

              {/* Layout Toggle: Auto / Side / Stack */}
              <button
                type="button"
                className="btn-pixel-icon"
                onClick={cycleLayout}
                title={`Layout: ${layoutOverride.toUpperCase()} (Click to toggle)`}
              >
                {effectiveLayout === 'side-by-side' ? <Columns size={13} /> : <Rows size={13} />}
                <span className="btn-label-text">
                  {layoutOverride === 'auto'
                    ? `AUTO (${effectiveLayout === 'side-by-side' ? 'SIDE' : 'STACK'})`
                    : layoutOverride === 'side-by-side'
                    ? 'SIDE'
                    : 'STACK'}
                </span>
              </button>

              {/* Image Fit Toggle: Contain / Cover */}
              {companionMode === 'booru' && (
                <button
                  type="button"
                  className="btn-pixel-icon"
                  onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
                  title={fitMode === 'contain' ? 'Switch to Cover Fit' : 'Switch to Full Contain Fit'}
                >
                  {fitMode === 'contain' ? <Maximize size={13} /> : <Minimize size={13} />}
                  <span className="btn-label-text">{fitMode === 'contain' ? 'FIT: ALL' : 'FIT: CROP'}</span>
                </button>
              )}

              {/* Hide Toggle */}
              <button
                type="button"
                className="btn-pixel-icon"
                onClick={() => setVisible(false)}
                title="Hide Companion"
              >
                <EyeOff size={13} />
              </button>
            </div>
          </div>

          {/* Dynamic dialogue / cheering text ("teks penyemangat") */}
          <div className="speech-balloon">
            <p className="speech-quote">"{dialogue}"</p>
          </div>

          {/* Realtime Telemetry & Momentum Meter */}
          <div className="deck-telemetry-bar">
            {isRunning ? (
              <div className="telemetry-flex live">
                <span className="pulse-dot" />
                <span className="stat-segment">
                  WPM: <strong className="text-arcade-gold">{wpm}</strong>
                </span>
                <span className="divider">·</span>
                <span className="stat-segment">
                  ACC: <strong>{accuracy}%</strong>
                </span>
                <span className="divider">·</span>
                <span className="stat-segment">
                  YAHS: <strong className="text-cyan">{phraseCount}</strong>
                </span>
                {combo > 0 && (
                  <>
                    <span className="divider">·</span>
                    <span className="stat-segment combo-segment">
                      <Flame size={12} className="flame-icon" />
                      COMBO: <strong className="text-pink">{combo}</strong>
                    </span>
                  </>
                )}
              </div>
            ) : isFinished ? (
              <div className="telemetry-flex finished">
                <span className="text-arcade-gold">SESSION COMPLETE</span>
                <span className="divider">·</span>
                <span>PRESS <kbd className="kbd-shortcut-mini">TAB</kbd> OR RESTART FOR NEXT RUN</span>
              </div>
            ) : (
              <div className="telemetry-flex idle">
                <span className="text-cyan">AWAITING FIRST KEYSTROKE...</span>
                <span className="divider">·</span>
                <span>READY TO SUFFER?</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Waifu Search & Gallery Picker Modal */}
      <WaifuSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        currentWaifuUrl={activeWaifu.url}
        onSelectWaifu={(selected) => {
          setActiveWaifu(selected);
          setDetectedOrientation(selected.orientation);
          setCompanionMode('booru');
          try {
            localStorage.setItem('wyt_selected_waifu_v1', JSON.stringify(selected));
          } catch {
            // Ignore
          }
        }}
      />
    </>
  );
};
