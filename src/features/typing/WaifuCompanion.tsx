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
  Minimize
} from 'lucide-react';

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

interface ExternalWaifu {
  url: string;
  source: string;
  name: string;
  orientation?: 'portrait' | 'landscape';
  width?: number;
  height?: number;
}

const DEFAULT_EXTERNAL_WAIFUS: ExternalWaifu[] = [
  // 1. Portrait - Aqua-hime (Safebooru) -> Side-by-Side (Image on left, cheering text on right)
  {
    url: 'https://safebooru.org/images/1365/4a36d78b3c9413f0854bec1c9687a180.jpeg',
    source: 'safebooru.org',
    name: 'Aqua-hime',
    orientation: 'portrait',
    width: 1061,
    height: 1500,
  },
  // 2. Landscape - Maomao (Konachan) -> Up-by-Low (Image on top, cheering text underneath)
  {
    url: 'https://konachan.net/sample/cb0405e90a962078d985c05846114bfa/Konachan.com%20-%20409854%20sample%20animal%20bird%20brown_hair%20chinese_clothes%20clouds%20grass%20kusuriya_no_hitorigoto%20maomao_%28kusuriya_no_hitorigoto%29%20purple_eyes%20sky%20sunset%20yurun_%28yurun_ume%29.jpg',
    source: 'konachan.net',
    name: 'Maomao-chan',
    orientation: 'landscape',
    width: 3000,
    height: 1747,
  },
  // 3. Landscape - August von Parseval (Konachan)
  {
    url: 'https://konachan.net/sample/71ec6d8be6131ac44eb52af0dcc33fbb/Konachan.com%20-%20409851%20sample%20anthropomorphism%20august_von_parseval_%28azur_lane%29%20azur_lane%20barefoot%20black_hair%20blue_eyes%20breasts%20car%20cleavage%20dress%20horns%20junwu%20long_hair%20wristwear.jpg',
    source: 'konachan.net',
    name: 'Parseval',
    orientation: 'landscape',
    width: 3000,
    height: 1800,
  },
  // 4. Portrait - Agnes Tachyon (Safebooru)
  {
    url: 'https://safebooru.org/images/1365/e56b5a2f40614c291108f37df991ca52.png',
    source: 'safebooru.org',
    name: 'Agnes Tachyon',
    orientation: 'portrait',
    width: 828,
    height: 1792,
  },
  // 5. Portrait - Sparkle Idol (Safebooru)
  {
    url: 'https://safebooru.org/images/1365/5a596ae8c622d9d11e7f3f6f62fa0687.jpeg',
    source: 'safebooru.org',
    name: 'Sparkle-chan',
    orientation: 'portrait',
    width: 900,
    height: 1200,
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
  // Default to 'booru' mode for big high-res waifu art, with instant toggle to 'mascot'
  const [companionMode, setCompanionMode] = useState<'booru' | 'mascot'>('booru');
  const [externalWaifus, setExternalWaifus] = useState<ExternalWaifu[]>(DEFAULT_EXTERNAL_WAIFUS);
  const [externalIndex, setExternalIndex] = useState<number>(0);
  const [loadingExternal, setLoadingExternal] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [layoutOverride, setLayoutOverride] = useState<LayoutMode>('auto');
  const [fitMode, setFitMode] = useState<FitMode>('contain');

  const prevErrorsRef = useRef<number>(errors);
  const [recentErrorPanic, setRecentErrorPanic] = useState<boolean>(false);

  const currentExternal = externalWaifus[externalIndex] || DEFAULT_EXTERNAL_WAIFUS[0];
  const [detectedOrientation, setDetectedOrientation] = useState<'portrait' | 'landscape'>(
    currentExternal.orientation || 'landscape'
  );

  // When externalIndex changes, sync detected orientation if already known
  useEffect(() => {
    if (currentExternal.orientation) {
      setDetectedOrientation(currentExternal.orientation);
    }
  }, [currentExternal]);

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
      // Portrait: height is noticeably greater than width
      // Landscape: width >= height
      const isPort = naturalHeight > naturalWidth * 1.08;
      setDetectedOrientation(isPort ? 'portrait' : 'landscape');
    }
  };

  // Determine effective layout:
  // If auto: portrait -> 'side-by-side', landscape -> 'up-by-low'
  const effectiveLayout: 'side-by-side' | 'up-by-low' = useMemo(() => {
    if (layoutOverride === 'side-by-side') return 'side-by-side';
    if (layoutOverride === 'up-by-low') return 'up-by-low';

    // Auto behavior requested by user:
    // "kalau image nya potrait buat side by side kalau gmabarnya landscape itu up by low"
    if (companionMode === 'mascot') {
      return 'side-by-side'; // Mascot is square/portrait, looks best side-by-side
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

  // Fetch more external waifus from booru APIs
  const fetchMoreExternal = async () => {
    setLoadingExternal(true);
    try {
      const rand = Math.random();
      let endpoint = '';
      let sourceName = '';

      if (rand < 0.4) {
        // Konachan (often high quality wallpapers / landscapes)
        endpoint = 'https://konachan.net/post.json?limit=10&tags=rating:s';
        sourceName = 'konachan.net';
      } else if (rand < 0.75) {
        // Yande.re (high quality portraits and full body art)
        endpoint = 'https://yande.re/post.json?limit=10&tags=rating:s';
        sourceName = 'yande.re';
      } else {
        // Safebooru
        endpoint = 'https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=10&tags=solo+rating:safe';
        sourceName = 'safebooru.org';
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const fresh: ExternalWaifu[] = data
            .map((p: { sample_url?: string; file_url?: string; preview_url?: string; width?: number; height?: number }) => {
              const url = p.sample_url || p.file_url || p.preview_url || '';
              const width = p.width || 0;
              const height = p.height || 0;
              const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape';
              return {
                url,
                source: sourceName,
                name: `Waifu #${Math.floor(100 + Math.random() * 900)}`,
                orientation,
                width,
                height,
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
      // Cycle through existing if network issue
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
                style={{ backgroundImage: `url(${currentExternal.url})` }}
              />

              <img
                src={currentExternal.url}
                alt={currentExternal.name}
                className={`external-avatar-img fit-${fitMode}`}
                loading="eager"
                referrerPolicy="no-referrer"
                onLoad={handleImageLoad}
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
                <span className="source-label">
                  [{currentExternal.source}] · {detectedOrientation.toUpperCase()}
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

            {companionMode === 'booru' && (
              <button
                type="button"
                className="btn-pixel-icon"
                onClick={handleNextExternal}
                disabled={loadingExternal}
                title="Reroll Artwork from yande.re / konachan / safebooru"
              >
                <RefreshCw size={13} className={loadingExternal ? 'spin' : ''} />
                <span className="btn-label-text">REROLL</span>
              </button>
            )}

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
  );
};
