import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Calendar, Clock, Flame, RefreshCw, AlertCircle, Sparkles, User } from 'lucide-react';
import { Duration, DURATIONS, LeaderboardEntry } from '../../types/typing';
import { fetchLeaderboard, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

export const LeaderboardView: React.FC<{
  onSelectUser?: (username: string) => void;
}> = ({ onSelectUser }) => {
  const { username: currentUsername } = useAuth();

  const [tab, setTab] = useState<'all-time' | 'daily' | 'weekly'>('all-time');
  const [duration, setDuration] = useState<Duration>(30);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard(tab, duration);
      setEntries(data);
    } catch {
      setError('Failed to load leaderboard rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab, duration]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="rank-badge gold"><Medal size={16} /> 1</span>;
    if (rank === 2) return <span className="rank-badge silver"><Medal size={16} /> 2</span>;
    if (rank === 3) return <span className="rank-badge bronze"><Medal size={16} /> 3</span>;
    return <span className="rank-badge default">{rank}</span>;
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="section-header">
        <div className="section-title-group">
          <div className="title-with-icon">
            <Trophy className="accent-icon" size={24} />
            <h1 className="section-title">Global Rankings</h1>
          </div>
          <p className="section-subtitle">
            Authoritative, server-verified typing runs. Tie-breaking rules: WPM &rarr; Accuracy &rarr; Earliest submission.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm refresh-btn"
          onClick={loadData}
          disabled={loading}
          title="Refresh rankings"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="leaderboard-tabs-bar">
        <div className="segmented-control">
          <button
            type="button"
            className={`seg-btn ${tab === 'all-time' ? 'active' : ''}`}
            onClick={() => setTab('all-time')}
          >
            <Sparkles size={14} />
            <span>All-Time</span>
          </button>
          <button
            type="button"
            className={`seg-btn ${tab === 'daily' ? 'active' : ''}`}
            onClick={() => setTab('daily')}
          >
            <Flame size={14} className="accent-icon" />
            <span>Daily Challenge</span>
          </button>
          <button
            type="button"
            className={`seg-btn ${tab === 'weekly' ? 'active' : ''}`}
            onClick={() => setTab('weekly')}
          >
            <Calendar size={14} />
            <span>This Week (UTC)</span>
          </button>
        </div>

        {tab !== 'daily' && (
          <div className="segmented-control duration-selector">
            <Clock size={14} className="control-icon" />
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`seg-btn ${duration === d ? 'active' : ''}`}
                onClick={() => setDuration(d)}
              >
                {d}s
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backend connection warning if unconfigured */}
      {!isSupabaseConfigured && (
        <div className="alert-notice warning mb-4">
          <AlertCircle size={16} />
          <span>
            Supabase database is currently in local offline mode. To view and submit live global scores, link your Supabase project in the repository.
          </span>
        </div>
      )}

      {/* Table / Results */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading-skeleton">
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : error ? (
          <div className="table-empty-state error">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
              Try Again
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="table-empty-state">
            <Trophy size={40} className="empty-icon" />
            <h3>No official scores yet</h3>
            <p>
              Be the first to survive {tab === 'daily' ? 'today’s Daily Challenge' : `${duration}s of When Yah`} and claim rank #1!
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Player</th>
                  <th style={{ textAlign: 'right' }}>WPM</th>
                  <th style={{ textAlign: 'right' }}>Raw WPM</th>
                  <th style={{ textAlign: 'right' }}>Accuracy</th>
                  <th style={{ textAlign: 'right' }}>Phrases</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row, idx) => {
                  const isCurrent = row.username.toLowerCase() === currentUsername.toLowerCase();
                  return (
                    <tr key={row.run_id || idx} className={isCurrent ? 'row-highlight' : ''}>
                      <td>{getRankBadge(row.rank || idx + 1)}</td>
                      <td>
                        <button
                          type="button"
                          className="player-name-link"
                          onClick={() => onSelectUser?.(row.username)}
                        >
                          <User size={14} className="player-avatar-icon" />
                          <span>{row.username}</span>
                          {isCurrent && <span className="you-pill">You</span>}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }} className="wpm-cell accent-text">
                        <strong>{row.wpm}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }} className="raw-wpm-cell">
                        {row.raw_wpm}
                      </td>
                      <td style={{ textAlign: 'right' }} className="acc-cell">
                        {row.accuracy}%
                      </td>
                      <td style={{ textAlign: 'right' }} className="phrase-cell">
                        {row.phrase_count}
                      </td>
                      <td style={{ textAlign: 'right' }} className="date-cell">
                        {formatDate(row.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
