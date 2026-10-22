import React, { useState, useMemo } from 'react';
import { RefreshCw, Heart, Sparkles, Eye, EyeOff } from 'lucide-react';

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
    url: 'https://nekos.best/api/v2/neko/78669584-d76e-4401-b0a3-9d48d5d91eb7.png',
    source: 'nekos.best / 雨音くるみ',
    name: 'Kurumi-chan',
  },
  {
    url: 'https://nekos.best/api/v2/neko/0c86089e-9d5f-4896-afd4-da6a1455b5bc.png',
    source: 'nekos.best / とあ',
    name: 'Toa-chan',
  },
  {
    url: 'https://nekos.best/api/v2/neko/1bb64761-d47f-4c60-b50f-df0171a35f56.png',
    source: 'nekos.best / いふゆー',
    name: 'Ifuyu-chan',
  },
  {
    url: 'https://nekos.best/api/v2/neko/70c20092-dd82-4130-9f05-548aacbe5ac8.png',
    source: 'nekos.best / ゆゅ',
    name: 'Yuyu-chan',
  },
  {
    url: 'https://konachan.net/sample/cb0405e90a962078d985c05846114bfa/Konachan.com%20-%20409854%20sample%20animal%20bird%20brown_hair%20chinese_clothes%20clouds%20grass%20kusuriya_no_hitorigoto%20maomao_%28kusuriya_no_hitorigoto%29%20purple_eyes%20sky%20sunset%20yurun_%28yurun_ume%29.jpg',
    source: 'konachan.net',
    name: 'Maomao-chan',
  },
  {
    url: 'https://files.yande.re/sample/9036298ef0da206e70f73ff66a1874f1/yande.re%201271064%20sample%20asaka_karin%20emma_verde%20konoe_kanata%20love_live%21_%28series%29%20mifune_shioriko%20nakasu_kasumi%20see_through%20tagme%20thighhighs%20uniform%20zhong_lanzhu.jpg',
    source: 'yande.re',
    name: 'Karin-chan',
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

  // Fetch more waifus from yande.re or konachan
  const fetchMoreWaifus = async () => {
    setLoadingNew(true);
    try {
      // Alternate between yande.re and konachan
      const isYande = Math.random() > 0.5;
      const endpoint = isYande
        ? 'https://yande.re/post.json?limit=10&tags=rating:s+solo'
        : 'https://konachan.net/post.json?limit=10&tags=rating:s';

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const fresh = data
            .filter((p: { sample_url?: string; preview_url?: string }) => p.sample_url || p.preview_url)
            .map((p: { sample_url?: string; preview_url?: string; author?: string }) => ({
              url: p.sample_url || p.preview_url || '',
              source: isYande ? 'yande.re' : 'konachan.net',
              name: `Waifu #${Math.floor(100 + Math.random() * 900)}`,
            }));
          if (fresh.length > 0) {
            setWaifus((prev) => [...fresh, ...prev]);
            setCurrentIndex(0);
          }
        }
      }
    } catch {
      // Cycle through existing
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

  // Dynamic reaction speech
  const dialogue = useMemo(() => {
    if (isFinished) {
      if (wpm >= 110) return "ANATA WA KAMI KA?! 🔥 Superhuman speed! Certified Yah Legend!";
      if (wpm >= 80) return `Otsukaresama! ${wpm} WPM is seriously impressive, runner-kun!`;
      if (wpm >= 50) return `Not bad at all! ${phraseCount} When Yahs typed! Keep practicing~`;
      return "Ganbare! Don't let your memes be dreams, try again!";
    }

    if (isRunning) {
      if (errors >= 4) return "B-Baka! Focus! Yah typos detected, don't rush!";
      if (wpm >= 110) return `H-HAYAI!! ${wpm} WPM?! Your fingers are blazing! ⚡`;
      if (wpm >= 80) return `Sugoi! ${wpm} WPM! Maintain that rhythm! ✨`;
      if (wpm >= 50) return `Good tempo! ${phraseCount} When Yahs down, keep going!`;
      return "Type fast, wait harder! You got this!";
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
    <div className="waifu-companion-pixel-box">
      {/* Waifu Avatar in Pixel Frame */}
      <div className="waifu-frame">
        <div className="waifu-pixel-border">
          <img
            src={currentWaifu.url}
            alt={currentWaifu.name}
            className="waifu-avatar-img"
            loading="lazy"
            onError={(e) => {
              // Fallback if third party image fails
              (e.target as HTMLImageElement).src = DEFAULT_WAIFUS[0].url;
            }}
          />
        </div>
        <div className="waifu-label-pill">
          <Heart size={10} className="heart-pulse" />
          <span>{currentWaifu.name}</span>
        </div>
      </div>

      {/* Retro Pixel Speech Bubble */}
      <div className="waifu-speech-bubble">
        <div className="speech-arrow-left" />
        <div className="speech-header-row">
          <span className="speech-tag">
            <Sparkles size={11} /> WAIFU CHEERLEADER
          </span>
          <span className="speech-source">{currentWaifu.source}</span>
        </div>
        <p className="speech-text">{dialogue}</p>
        <div className="speech-metrics-pill">
          {isRunning && (
            <span className="live-stat-badge">
              LIVE: <strong>{wpm}</strong> WPM · ACC: <strong>{accuracy}%</strong>
            </span>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="waifu-actions">
        <button
          type="button"
          className="btn-pixel btn-pixel-icon"
          onClick={handleNext}
          disabled={loadingNew}
          title="Reroll Waifu (yande.re / konachan / nekos)"
        >
          <RefreshCw size={12} className={loadingNew ? 'spin' : ''} />
        </button>
        <button
          type="button"
          className="btn-pixel btn-pixel-icon"
          onClick={() => setVisible(false)}
          title="Hide Waifu Companion"
        >
          <EyeOff size={12} />
        </button>
      </div>
    </div>
  );
};
