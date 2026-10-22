import React, { useState, useMemo } from 'react';
import { RefreshCw, Heart, Sparkles, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';

interface WaifuCompanionProps {
  isRunning: boolean;
  isFinished: boolean;
  wpm: number;
  accuracy: number;
  errors: number;
  phraseCount: number;
}

interface WaifuImage {
  url: string;
  source: string;
  name: string;
}

const DEFAULT_WAIFUS: WaifuImage[] = [
  {
    url: 'https://konachan.net/sample/cb0405e90a962078d985c05846114bfa/Konachan.com%20-%20409854%20sample%20animal%20bird%20brown_hair%20chinese_clothes%20clouds%20grass%20kusuriya_no_hitorigoto%20maomao_%28kusuriya_no_hitorigoto%29%20purple_eyes%20sky%20sunset%20yurun_%28yurun_ume%29.jpg',
    source: 'konachan.net',
    name: 'Maomao-chan',
  },
  {
    url: 'https://konachan.net/sample/71ec6d8be6131ac44eb52af0dcc33fbb/Konachan.com%20-%20409851%20sample%20anthropomorphism%20august_von_parseval_%28azur_lane%29%20azur_lane%20barefoot%20black_hair%20blue_eyes%20breasts%20car%20cleavage%20dress%20horns%20junwu%20long_hair%20wristwear.jpg',
    source: 'konachan.net',
    name: 'Parseval',
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
  {
    url: 'https://safebooru.org/images/597/1b967bdfc66a8c28c1bab09bef39a15c.jpeg',
    source: 'safebooru.org',
    name: 'Rei-chan',
  },
];

export const WaifuCompanion: React.FC<WaifuCompanionProps> = ({
  isRunning,
  isFinished,
  wpm,
  accuracy,
  errors,
  phraseCount,
}) => {
  const [waifus, setWaifus] = useState<WaifuImage[]>(DEFAULT_WAIFUS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loadingNew, setLoadingNew] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [isLarge, setIsLarge] = useState<boolean>(true); // Default to BIG waifu artwork as requested!

  // Fetch more waifus from safebooru or konachan
  const fetchMoreWaifus = async () => {
    setLoadingNew(true);
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
            .map((p: { sample_url?: string; preview_url?: string; file_url?: string; author?: string }) => {
              const url = p.sample_url || p.file_url || p.preview_url || '';
              return {
                url,
                source: isKonachan ? 'konachan.net' : 'safebooru.org',
                name: `Waifu #${Math.floor(100 + Math.random() * 900)}`,
              };
            })
            .filter((p) => p.url.length > 0);

          if (fresh.length > 0) {
            setWaifus((prev) => [...fresh, ...prev]);
            setCurrentIndex(0);
          }
        }
      }
    } catch {
      // Cycle through existing if network issue
      setCurrentIndex((prev) => (prev + 1) % waifus.length);
    } finally {
      setLoadingNew(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < waifus.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      fetchMoreWaifus();
    }
  };

  const currentWaifu = waifus[currentIndex] || DEFAULT_WAIFUS[0];

  // Dynamic reaction speech based on live typing status
  const dialogue = useMemo(() => {
    if (isFinished) {
      if (wpm >= 110) return "ANATA WA KAMI KA?! 🔥 Superhuman speed! Certified When Yah Legend!";
      if (wpm >= 80) return `Otsukaresama! ${wpm} WPM is seriously incredible, runner-kun!`;
      if (wpm >= 50) return `Not bad at all! ${phraseCount} When Yahs typed! Keep pressing forward! ✨`;
      return "Ganbare! Don't let your memes be dreams, ready to try again! 💕";
    }

    if (isRunning) {
      if (errors >= 4) return "B-Baka! Focus! Yah typos detected, don't rush the rhythm! 💢";
      if (wpm >= 110) return `H-HAYAI!! ${wpm} WPM?! Your fingers are moving at godspeed! ⚡`;
      if (wpm >= 80) return `Sugoi! ${wpm} WPM! That pace is blazing hot! ✨`;
      if (wpm >= 50) return `Good tempo! ${phraseCount} When Yahs down, keep going! 💪`;
      return "Type fast, wait harder! Your destiny awaits! 🌟";
    }

    return "Ganbatte, runner-kun! Type 'When Yah' to begin our test! 💕";
  }, [isRunning, isFinished, wpm, errors, phraseCount]);

  if (!visible) {
    return (
      <div className="waifu-collapsed-bar">
        <button
          type="button"
          className="btn-pixel btn-pixel-sm"
          onClick={() => setVisible(true)}
          title="Summon Waifu Cheerleader"
        >
          <Eye size={12} />
          <span>[ WAIFU ON ]</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`waifu-companion-pixel-box ${isLarge ? 'waifu-mode-large' : 'waifu-mode-compact'}`}>
      {/* Waifu Portrait in Heavy Pixel Frame */}
      <div className="waifu-frame">
        <div className="waifu-pixel-border">
          {/* Corner pixel badges */}
          <div className="corner-pixel corner-tl" />
          <div className="corner-pixel corner-tr" />
          <div className="corner-pixel corner-bl" />
          <div className="corner-pixel corner-br" />

          <img
            src={currentWaifu.url}
            alt={currentWaifu.name}
            className="waifu-avatar-img"
            loading="eager"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Smooth fallback to default reliable sample
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_WAIFUS[0].url) {
                target.src = DEFAULT_WAIFUS[0].url;
              }
            }}
          />

          <div className="waifu-overlay-badge">
            <Heart size={11} className="heart-pulse text-waifu" />
            <span>{currentWaifu.name}</span>
          </div>
        </div>

        <div className="waifu-source-tag">
          <span>SOURCE: {currentWaifu.source}</span>
        </div>
      </div>

      {/* Retro Pixel Speech & Command Center */}
      <div className="waifu-speech-bubble">
        <div className="speech-header-row">
          <div className="speech-tag">
            <Sparkles size={13} className="text-waifu" />
            <span>★ WAIFU CHEERLEADER ★</span>
          </div>

          {/* Quick Controls */}
          <div className="waifu-mini-controls">
            <button
              type="button"
              className="btn-pixel-icon"
              onClick={handleNext}
              disabled={loadingNew}
              title="Reroll Waifu Illustration"
            >
              <RefreshCw size={13} className={loadingNew ? 'spin' : ''} />
              <span className="btn-label-text">REROLL</span>
            </button>

            <button
              type="button"
              className="btn-pixel-icon"
              onClick={() => setIsLarge(!isLarge)}
              title={isLarge ? 'Switch to Compact Waifu' : 'Switch to Large Waifu'}
            >
              {isLarge ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="btn-label-text">{isLarge ? 'COMPACT' : 'LARGE'}</span>
            </button>

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

        {/* Dynamic dialogue text */}
        <div className="speech-content-wrap">
          <p className="speech-text">"{dialogue}"</p>
        </div>

        {/* Live typing telemetry bar */}
        <div className="waifu-telemetry-row">
          {isRunning ? (
            <div className="telemetry-pill live">
              <span className="dot pulse" />
              <span>LIVE: <strong>{wpm}</strong> WPM</span>
              <span className="divider">·</span>
              <span>ACCURACY: <strong>{accuracy}%</strong></span>
              <span className="divider">·</span>
              <span>WHEN YAHS: <strong>{phraseCount}</strong></span>
            </div>
          ) : isFinished ? (
            <div className="telemetry-pill finished">
              <span>FINISHED! PRESS <kbd className="kbd-shortcut-mini">TAB</kbd> OR RESTART TO PLAY AGAIN</span>
            </div>
          ) : (
            <div className="telemetry-pill idle">
              <span>AWAITING FIRST KEYSTROKE... READY TO SUFFER?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
