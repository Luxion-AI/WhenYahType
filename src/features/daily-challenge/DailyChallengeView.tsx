import React, { useEffect, useState } from 'react';
import { Clock, Flame, ShieldCheck, Play, Trophy, CheckCircle2 } from 'lucide-react';
import { getTimeUntilNextUTCMidnight, getTodayUTC } from '../../lib/generator';
import { fetchLeaderboard } from '../../lib/supabase';
import { LeaderboardEntry } from '../../types/typing';

interface DailyChallengeViewProps {
  onStartChallenge: () => void;
  onSelectUser?: (username: string) => void;
}

export const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({
  onStartChallenge,
  onSelectUser,
}) => {
  const today = getTodayUTC();
  const [countdown, setCountdown] = useState(getTimeUntilNextUTCMidnight());
  const [dailyScores, setDailyScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNextUTCMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's top daily scores
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchLeaderboard('daily', 60, today);
      setDailyScores(data);
      setLoading(false);
    };
    load();
  }, [today]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="daily-challenge-container">
      {/* Hero Card */}
      <div className="daily-hero-card">
        <div className="daily-hero-left">
          <div className="daily-badge">
            <Flame size={16} className="flame-icon" />
            <span>Official Daily Challenge · UTC</span>
          </div>

          <h1 className="daily-title">Challenge Date: {today}</h1>
          <p className="daily-description">
            Every competitor across the globe receives the exact same deterministic phrase stream. 
            60 seconds on the clock. One goal: Maximum When Yahs with absolute precision.
          </p>

          <div className="daily-rules-row">
            <div className="rule-item">
              <Clock size={16} className="accent-icon" />
              <span><strong>60s</strong> Duration</span>
            </div>
            <div className="rule-item">
              <ShieldCheck size={16} className="accent-icon" />
              <span>Deterministic Seed: <code>{today}</code></span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg start-daily-btn"
            onClick={onStartChallenge}
          >
            <Play size={18} fill="currentColor" />
            <span>Launch Today’s Run</span>
          </button>
        </div>

        <div className="daily-hero-right">
          <div className="countdown-card">
            <span className="countdown-label">Next UTC Challenge In</span>
            <div className="countdown-digits">
              <div className="digit-col">
                <span className="digit-val">{pad(countdown.hours)}</span>
                <span className="digit-sub">Hours</span>
              </div>
              <span className="digit-separator">:</span>
              <div className="digit-col">
                <span className="digit-val">{pad(countdown.minutes)}</span>
                <span className="digit-sub">Mins</span>
              </div>
              <span className="digit-separator">:</span>
              <div className="digit-col">
                <span className="digit-val">{pad(countdown.seconds)}</span>
                <span className="digit-sub">Secs</span>
              </div>
            </div>
            <span className="countdown-timezone">UTC Reset at 00:00:00</span>
          </div>
        </div>
      </div>

      {/* Today's Standings */}
      <div className="daily-standings-section">
        <div className="section-header">
          <div className="title-with-icon">
            <Trophy size={20} className="accent-icon" />
            <h2 className="section-title">Today's Top Survivors</h2>
          </div>
        </div>

        <div className="table-card">
          {loading ? (
            <div className="table-loading-skeleton">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : dailyScores.length === 0 ? (
            <div className="table-empty-state">
              <CheckCircle2 size={36} className="empty-icon" />
              <h3>The arena is waiting</h3>
              <p>No verified runs recorded for {today} yet. Set the world benchmark now.</p>
            </div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Player</th>
                  <th style={{ textAlign: 'right' }}>WPM</th>
                  <th style={{ textAlign: 'right' }}>Accuracy</th>
                  <th style={{ textAlign: 'right' }}>When Yahs</th>
                </tr>
              </thead>
              <tbody>
                {dailyScores.slice(0, 10).map((row, idx) => (
                  <tr key={row.run_id || idx}>
                    <td>
                      <span className={`rank-badge ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : 'default'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="player-name-link"
                        onClick={() => onSelectUser?.(row.username)}
                      >
                        {row.username}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }} className="wpm-cell accent-text">
                      <strong>{row.wpm}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>{row.accuracy}%</td>
                    <td style={{ textAlign: 'right' }}>{row.phrase_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
