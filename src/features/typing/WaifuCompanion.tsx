import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles, Eye, EyeOff, Maximize2, Minimize2, Image as ImageIcon, Flame, Heart, RefreshCw } from 'lucide-react';

export type CompanionEmotion = 'idle' | 'cheer' | 'panic' | 'victory';

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

interface ExternalWaifu {
  url: string;
  source: string;
  name: string;
}

const DEFAULT_EXTERNAL_WAIFUS: ExternalWaifu[] = [
  {
    url: 'https://konachan.net/sample/cb0405e90a962078d985c05846114bfa/Konachan.com%20-%20409854%20sample%20animal%20bird%20brown_hair%20chinese_clothes%20clouds%20grass%20kusuriya_no_hitorigoto%20maomao_%28kusuriya_no_hitorigoto%29%20purple_eyes%20sky%20sunset%20yurun_%28yurun_ume%29.jpg',
    source: 'konachan.net',
    name: 'Maomao-chan',
  },
  {
    url: 'https://safebooru.org/images/1365/e56b5a2f40614c291108f37df991ca52.png',
    source: 'safebooru.org',
    name: 'Agnes Tachyon',
  },
  {
    url: 'https://safebooru.org/images/1365/4a36d78b3c9413f0854bec1c9687a180.jpeg',
    source: 'safebooru.org',
    name: 'Aqua-hime',
  },
];

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
  // Mode: 'mascot' (local original Yah-chan pixel sprite) vs 'booru' (external anime gallery)
  const [companionMode, setCompanionMode] = useState<'mascot' | 'booru'>('mascot');
  const [externalWaifus, setExternalWaifus] = useState<ExternalWaifu[]>(DEFAULT_EXTERNAL_WAIFUS);
  const [externalIndex, setExternalIndex] = useState<number>(0);
  const [loadingExternal, setLoadingExternal] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [isLarge, setIsLarge] = useState<boolean>(true); // Big waifu frame default as requested
  const prevErrorsRef = useRef<number>(errors);
  const [recentErrorPanic, setRecentErrorPanic] = useState<boolean>(false);

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
        return `Otsukaresama! ${wpm} WPM with a best combo of ${bestCombo}! That was blistering fast! ✨`;
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

  // Fetch more external waifus if in Booru mode
  const fetchMoreExternal = async () => {
    setLoadingExternal(true);
    try {
      const isKonachan = Math.random() > 0.5;
      const endpoint = isKonachan
        ? 'https://konachan.net/post.json?limit=10&tags=rating:s'
        : 'https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=10&tags=solo+rating:safe';

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const fresh = data
            .map((p: { sample_url?: string; preview_url?: string; file_url?: string }) => {
              const url = p.sample_url || p.file_url || p.preview_url || '';
              return {
                url,
                source: isKonachan ? 'konachan.net' : 'safebooru.org',
                name: `Waifu #${Math.floor(100 + Math.random() * 900)}`,
              };
            })
            .filter((p) => p.url.length > 0);

          if (fresh.length > 0) {
            setExternalWaifus((prev) => [...fresh, ...prev]);
            setExternalIndex(0);
          }
        }
      }
    } catch {
      setExternalIndex((prev) => (prev + 1) % externalWaifus.length);
    } finally {
      setLoadingExternal(false);
    }
  };

  const handleNextExternal = () => {
    if (externalIndex + 1 < externalWaifus.length) {
      setExternalIndex((prev) => prev + 1);
    } else {
      fetchMoreExternal();
    }
  };

  const currentExternal = externalWaifus[externalIndex] || DEFAULT_EXTERNAL_WAIFUS[0];

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
    <div className={`companion-stage ${isLarge ? 'stage-large' : 'stage-compact'} emotion-${emotion}`}>
      {/* Visual Character Frame */}
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
              />
              <div className="mascot-nameplate">
                <Heart size={11} className="heart-pulse text-waifu" />
                <span>YAH-CHAN</span>
                <span className={`status-pill-mini ${emotionBadge.colorClass}`}>{emotionBadge.label}</span>
              </div>
            </div>
          ) : (
            <div className="external-waifu-container">
              <img
                src={currentExternal.url}
                alt={currentExternal.name}
                className="external-avatar-img"
                loading="eager"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== DEFAULT_EXTERNAL_WAIFUS[0].url) {
                    target.src = DEFAULT_EXTERNAL_WAIFUS[0].url;
                  }
                }}
              />
              <div className="mascot-nameplate">
                <Heart size={11} className="heart-pulse text-waifu" />
                <span>{currentExternal.name}</span>
                <span className="source-label">{currentExternal.source}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Arcade Dialogue & Command Deck */}
      <div className="companion-dialogue-deck">
        <div className="deck-header-row">
          <div className="deck-title-tag">
            <Sparkles size={13} className="text-arcade-gold" />
            <span className="deck-tag-text">
              {companionMode === 'mascot' ? '★ ARCADE CHEERLEADER ★' : '★ WAIFU GALLERY ★'}
            </span>
          </div>

          {/* Quick Arcade Controls */}
          <div className="deck-controls">
            {/* Mode Toggle: Mascot vs Booru */}
            <button
              type="button"
              className={`btn-pixel-icon ${companionMode === 'mascot' ? 'btn-active' : ''}`}
              onClick={() => setCompanionMode(companionMode === 'mascot' ? 'booru' : 'mascot')}
              title={companionMode === 'mascot' ? 'Switch to Anime Booru Gallery' : 'Switch to Original Pixel Yah-chan'}
            >
              <ImageIcon size={13} />
              <span className="btn-label-text">
                {companionMode === 'mascot' ? 'PIXEL' : 'BOORU'}
              </span>
            </button>

            {companionMode === 'booru' && (
              <button
                type="button"
                className="btn-pixel-icon"
                onClick={handleNextExternal}
                disabled={loadingExternal}
                title="Reroll Artwork"
              >
                <RefreshCw size={13} className={loadingExternal ? 'spin' : ''} />
                <span className="btn-label-text">REROLL</span>
              </button>
            )}

            {/* Size Toggle (Large/Compact) */}
            <button
              type="button"
              className="btn-pixel-icon"
              onClick={() => setIsLarge(!isLarge)}
              title={isLarge ? 'Compact View' : 'Large View'}
            >
              {isLarge ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="btn-label-text">{isLarge ? 'COMPACT' : 'LARGE'}</span>
            </button>

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

        {/* Dynamic dialogue text bubble */}
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
  );
};
