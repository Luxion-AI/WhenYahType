import React, { useEffect, useState } from 'react';
import { 
  User, 
  Calendar, 
  Target, 
  Award, 
  ShieldCheck, 
  Clock, 
  Lock,
  ArrowLeft
} from 'lucide-react';
import { Achievement, DURATIONS, LeaderboardEntry, UserProfile } from '../../types/typing';
import { fetchUserProfile } from '../../lib/supabase';
import { getPersonalBests, getLocalRuns } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';

interface ProfileViewProps {
  targetUsername?: string;
  onBack?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ targetUsername, onBack }) => {
  const { username: currentUsername, isGuest } = useAuth();
  const effectiveUsername = targetUsername || currentUsername;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentRuns, setRecentRuns] = useState<LeaderboardEntry[]>([]);
  const [, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchUserProfile(effectiveUsername);

      if (res.profile) {
        setProfile(res.profile);
        setAchievements(res.achievements);
        setRecentRuns(res.recentRuns);
      } else {
        // Fallback for guest or offline profile
        const localPbs = getPersonalBests();
        const localRuns = getLocalRuns();
        const totalPhrases = localRuns.reduce((acc, r) => acc + r.phraseCount, 0);
        const avgAcc = localRuns.length > 0
          ? Math.round((localRuns.reduce((acc, r) => acc + r.accuracy, 0) / localRuns.length) * 10) / 10
          : 0;

        setProfile({
          id: 'local-guest',
          username: effectiveUsername,
          display_name: effectiveUsername,
          created_at: new Date().toISOString(),
          stats: {
            totalRuns: localRuns.length,
            bestWpmByDuration: localPbs,
            averageAccuracy: avgAcc,
            totalPhrases,
          },
        });

        // Default achievements preview
        setAchievements([
          { id: 'first_blood', name: 'First Yah', description: 'Completed your very first run.', icon: 'Sparkles', badge_tier: 'bronze', unlocked: localRuns.length > 0 },
          { id: 'speed_demon_60', name: 'Wait Harder', description: 'Clocked 60+ WPM typing When Yah.', icon: 'Zap', badge_tier: 'silver', unlocked: Object.values(localPbs).some(w => w >= 60) },
          { id: 'century_club', name: 'Century of Yah', description: 'Broke past 100+ WPM.', icon: 'Crown', badge_tier: 'gold', unlocked: Object.values(localPbs).some(w => w >= 100) },
          { id: 'touch_grass', name: 'Touch Grass', description: 'Surpassed 35 phrases in one run.', icon: 'Award', badge_tier: 'meme', unlocked: false },
        ]);

        setRecentRuns(
          localRuns.slice(0, 15).map((r, i) => ({
            user_id: 'local',
            username: effectiveUsername,
            duration: r.duration,
            wpm: r.wpm,
            raw_wpm: r.rawWpm,
            accuracy: r.accuracy,
            phrase_count: r.phraseCount,
            created_at: r.createdAt,
            rank: i + 1,
          }))
        );
      }
      setLoading(false);
    };

    load();
  }, [effectiveUsername]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="profile-container">
      {onBack && (
        <button type="button" className="btn btn-ghost btn-sm mb-4" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Arena</span>
        </button>
      )}

      {/* Profile Header Banner */}
      <div className="profile-hero-card">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-placeholder">
            <User size={36} />
          </div>
        </div>

        <div className="profile-info-group">
          <div className="profile-title-row">
            <h1 className="profile-username">{profile?.username || effectiveUsername}</h1>
            <span className="profile-status-tag">
              {isGuest ? 'Guest Runner' : 'Verified Competitor'}
            </span>
          </div>

          <p className="profile-bio">
            {profile?.bio || 'Certified When Yah Enjoyer. Typing fast and waiting harder.'}
          </p>

          <div className="profile-meta-row">
            <div className="meta-item">
              <Calendar size={14} />
              <span>Joined {profile?.created_at ? formatDate(profile.created_at) : 'Today'}</span>
            </div>
            <div className="meta-item">
              <ShieldCheck size={14} />
              <span>{profile?.stats?.totalRuns || 0} Total Completed Runs</span>
            </div>
            <div className="meta-item">
              <Target size={14} />
              <span>{profile?.stats?.averageAccuracy || 0}% Avg Accuracy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Records Cards */}
      <div className="profile-section">
        <h2 className="section-title text-sm uppercase tracking-wider mb-3">Personal Records</h2>
        <div className="records-grid">
          {DURATIONS.map((dur) => {
            const pb = profile?.stats?.bestWpmByDuration[dur] || 0;
            return (
              <div key={dur} className="record-card">
                <span className="record-duration">{dur} Seconds</span>
                <div className="record-wpm">
                  <strong>{pb}</strong> <span className="unit">WPM</span>
                </div>
                <span className="record-sub">
                  {pb > 0 ? 'Verified Record' : 'No attempt yet'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Gallery */}
      <div className="profile-section">
        <h2 className="section-title text-sm uppercase tracking-wider mb-3">Badges & Achievements</h2>
        <div className="achievements-grid">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`achievement-card ${ach.unlocked ? `unlocked tier-${ach.badge_tier}` : 'locked'}`}
            >
              <div className="ach-icon-wrapper">
                {ach.unlocked ? <Award size={20} /> : <Lock size={18} />}
              </div>
              <div className="ach-content">
                <h4 className="ach-name">{ach.name}</h4>
                <p className="ach-desc">{ach.description}</p>
                {ach.unlocked && ach.unlocked_at && (
                  <span className="ach-date">Unlocked {formatDate(ach.unlocked_at)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="profile-section">
        <h2 className="section-title text-sm uppercase tracking-wider mb-3">Recent Runs</h2>
        <div className="table-card">
          {recentRuns.length === 0 ? (
            <div className="table-empty-state">
              <Clock size={32} className="empty-icon" />
              <p>No recent typing runs recorded yet.</p>
            </div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Mode / Duration</th>
                  <th style={{ textAlign: 'right' }}>WPM</th>
                  <th style={{ textAlign: 'right' }}>Accuracy</th>
                  <th style={{ textAlign: 'right' }}>Phrases</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((r, i) => (
                  <tr key={r.run_id || i}>
                    <td>
                      <span className="duration-tag">{r.duration}s Classic</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="wpm-cell accent-text">
                      <strong>{r.wpm}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>{r.accuracy}%</td>
                    <td style={{ textAlign: 'right' }}>{r.phrase_count}</td>
                    <td style={{ textAlign: 'right' }}>{formatDate(r.created_at)}</td>
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
