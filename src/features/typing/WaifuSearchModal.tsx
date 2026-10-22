import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  Sparkles, 
  Check, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Columns, 
  Rows, 
  Loader2 
} from 'lucide-react';
import { BooruWaifu, CURATED_WAIFUS, searchBooru } from '../../lib/booru';

interface WaifuSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWaifuUrl?: string;
  onSelectWaifu: (waifu: BooruWaifu) => void;
}

const PRESET_TAGS = [
  { label: '★ Curated', tag: '' },
  { label: 'Frieren', tag: 'frieren' },
  { label: 'Hatsune Miku', tag: 'hatsune_miku' },
  { label: 'Maomao', tag: 'maomao' },
  { label: 'Genshin Impact', tag: 'genshin_impact' },
  { label: 'Rem', tag: 'rem' },
  { label: 'Aqua', tag: 'aqua' },
  { label: 'Bocchi', tag: 'bocchi' },
  { label: 'Cyberpunk', tag: 'cyberpunk' },
  { label: 'Solo Cute', tag: 'solo' },
];

export const WaifuSearchModal: React.FC<WaifuSearchModalProps> = ({
  isOpen,
  onClose,
  currentWaifuUrl,
  onSelectWaifu,
}) => {
  const [query, setQuery] = useState<string>('');
  const [source, setSource] = useState<'all' | 'konachan' | 'safebooru'>('all');
  const [orientationFilter, setOrientationFilter] = useState<'all' | 'portrait' | 'landscape'>('all');
  const [results, setResults] = useState<BooruWaifu[]>(CURATED_WAIFUS);
  const [loading, setLoading] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Keyboard navigation: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Execute search
  const executeSearch = async (searchTerm: string, selectedSource = source) => {
    if (!searchTerm.trim()) {
      setResults(CURATED_WAIFUS);
      return;
    }

    setLoading(true);
    try {
      const data = await searchBooru(searchTerm, selectedSource);
      if (data.length > 0) {
        setResults(data);
      } else {
        // Fallback to local filtering of curated waifus
        const filtered = CURATED_WAIFUS.filter((w) =>
          w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setResults(filtered.length > 0 ? filtered : CURATED_WAIFUS);
      }
    } catch {
      setResults(CURATED_WAIFUS);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handlePresetClick = (tag: string) => {
    setQuery(tag);
    executeSearch(tag);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const customWaifu: BooruWaifu = {
      id: `custom-${Date.now()}`,
      url: customUrl.trim(),
      previewUrl: customUrl.trim(),
      source: 'custom url',
      name: customName.trim() || 'Custom Waifu',
      tags: ['custom'],
      width: 1920,
      height: 1080,
      orientation: 'landscape',
    };

    onSelectWaifu(customWaifu);
    onClose();
  };

  // Filtered by orientation if selected
  const displayedResults = results.filter((w) => {
    if (orientationFilter === 'all') return true;
    return w.orientation === orientationFilter;
  });

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card waifu-search-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search and choose waifu companion"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="title-with-icon">
            <Sparkles size={18} className="text-arcade-gold" />
            <h2 className="modal-title">CHOOSE YOUR WAIFU COMPANION</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn btn-pixel-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <p className="waifu-search-desc">
          Search characters or pick from Konachan & Safebooru. Portrait images automatically adapt to <strong>Side-by-Side</strong>, while landscape images expand <strong>Up-by-Low</strong> with cheering text underneath!
        </p>

        {/* Search input bar */}
        <form onSubmit={handleSearchSubmit} className="waifu-search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon-inside" />
            <input
              type="text"
              className="pixel-input waifu-search-field"
              placeholder="Search anime, character, e.g. frieren, miku, genshin, maomao..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setQuery('');
                  setResults(CURATED_WAIFUS);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary search-action-btn"
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
            <span>SEARCH</span>
          </button>
        </form>

        {/* Filter Toolbar & Quick Preset Tags */}
        <div className="waifu-toolbar-row">
          {/* Quick Preset Tags */}
          <div className="preset-tags-scroll">
            {PRESET_TAGS.map(({ label, tag }) => (
              <button
                key={label}
                type="button"
                className={`tag-pill-btn ${query === tag ? 'active' : ''}`}
                onClick={() => handlePresetClick(tag)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filters: Source & Orientation */}
          <div className="waifu-filter-group">
            <select
              className="pixel-select"
              value={source}
              onChange={(e) => {
                const s = e.target.value as 'all' | 'konachan' | 'safebooru';
                setSource(s);
                executeSearch(query, s);
              }}
              title="Filter Booru Source"
            >
              <option value="all">All Sources</option>
              <option value="konachan">Konachan.net</option>
              <option value="safebooru">Safebooru.org</option>
            </select>

            <select
              className="pixel-select"
              value={orientationFilter}
              onChange={(e) => setOrientationFilter(e.target.value as 'all' | 'portrait' | 'landscape')}
              title="Filter Aspect Ratio"
            >
              <option value="all">All Layouts</option>
              <option value="portrait">Portrait (Side)</option>
              <option value="landscape">Landscape (Stack)</option>
            </select>

            <button
              type="button"
              className="btn-pixel btn-pixel-sm custom-url-toggle"
              onClick={() => setShowCustomInput(!showCustomInput)}
              title="Paste direct custom image URL"
            >
              <LinkIcon size={12} />
              <span>{showCustomInput ? 'Hide URL' : 'Paste URL'}</span>
            </button>
          </div>
        </div>

        {/* Custom URL Accordion */}
        {showCustomInput && (
          <form onSubmit={handleAddCustom} className="custom-url-box">
            <div className="custom-url-fields">
              <input
                type="url"
                className="pixel-input"
                placeholder="Direct image URL (https://...jpg / png / webp)"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                required
              />
              <input
                type="text"
                className="pixel-input"
                placeholder="Companion Name (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              <Check size={14} />
              <span>Set Custom Waifu</span>
            </button>
          </form>
        )}

        {/* Gallery Results Grid */}
        <div className="waifu-gallery-scroll">
          {loading ? (
            <div className="waifu-gallery-loading">
              <Loader2 size={28} className="spin text-arcade-gold" />
              <span>FETCHING ANIME ILLUSTRATIONS...</span>
            </div>
          ) : displayedResults.length === 0 ? (
            <div className="waifu-gallery-empty">
              <ImageIcon size={32} className="text-dim" />
              <p>No illustrations found for "{query}". Try another tag or character name!</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-2"
                onClick={() => {
                  setQuery('');
                  setResults(CURATED_WAIFUS);
                }}
              >
                Reset to Curated Waifus
              </button>
            </div>
          ) : (
            <div className="waifu-cards-grid">
              {displayedResults.map((waifu) => {
                const isSelected = currentWaifuUrl === waifu.url;
                const isPort = waifu.orientation === 'portrait';

                return (
                  <div
                    key={waifu.id}
                    className={`waifu-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectWaifu(waifu);
                      onClose();
                    }}
                  >
                    <div className="card-image-wrap">
                      <img
                        src={waifu.previewUrl || waifu.url}
                        alt={waifu.name}
                        className="card-thumb-img"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />

                      {/* Orientation badge */}
                      <div className={`card-orientation-badge ${isPort ? 'port' : 'land'}`}>
                        {isPort ? <Columns size={10} /> : <Rows size={10} />}
                        <span>{isPort ? 'PORTRAIT' : 'LANDSCAPE'}</span>
                      </div>

                      {/* Selected checkmark banner */}
                      {isSelected && (
                        <div className="card-selected-banner">
                          <Check size={12} />
                          <span>ACTIVE</span>
                        </div>
                      )}
                    </div>

                    <div className="card-meta-wrap">
                      <strong className="card-waifu-name" title={waifu.name}>
                        {waifu.name}
                      </strong>
                      <div className="card-sub-info">
                        <span className="card-source-tag">{waifu.source}</span>
                        {waifu.width > 0 && (
                          <span className="card-res-tag">
                            {waifu.width}×{waifu.height}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="waifu-modal-footer">
          <span className="text-dim text-xs">
            Found {displayedResults.length} illustrations · Click any waifu card to select
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
