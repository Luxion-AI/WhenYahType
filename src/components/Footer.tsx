import React, { useEffect, useState } from 'react';
import { Github } from 'lucide-react';

export const Footer: React.FC = () => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      setUtcTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="shortcuts-hint">
            <span className="hint-item">
              <kbd className="kbd-key">Tab</kbd> restart test
            </span>
            <span className="hint-item">
              <kbd className="kbd-key">Esc</kbd> reset focus
            </span>
          </div>
        </div>

        <div className="footer-center">
          <span className="footer-meme-tagline">
            WhenYahType — Certified When Yah waiting arena
          </span>
        </div>

        <div className="footer-right">
          <span className="utc-clock">{utcTime}</span>
          <a
            href="https://github.com/Luxion-AI/WhenYahType"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="View source on GitHub"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
