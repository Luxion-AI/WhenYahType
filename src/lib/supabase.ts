import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Duration, Mode, RunTicket, LeaderboardEntry, UserProfile, Achievement } from '../types/typing';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_PROJECT') && 
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * Request an anti-cheat single-use run ticket from Edge Function
 */
export async function requestRunTicket(mode: Mode, duration: Duration): Promise<RunTicket | null> {
  if (!supabase) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return null;

    const res = await supabase.functions.invoke('issue-ticket', {
      body: { mode, duration },
    });

    if (res.error || !res.data?.ok) {
      console.warn('Ticket request error:', res.error || res.data?.error);
      return null;
    }

    return res.data.ticket as RunTicket;
  } catch (err) {
    console.warn('Failed to invoke issue-ticket:', err);
    return null;
  }
}

/**
 * Submit run evidence to Edge Function for server-side verification
 */
export async function submitRunScore(params: {
  ticketId: string;
  typed: string;
  elapsedMs: number;
}): Promise<{
  ok: boolean;
  verified?: boolean;
  runId?: string;
  score?: {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    phraseCount: number;
    correct: number;
    errors: number;
  };
  newAchievements?: string[];
  error?: string;
}> {
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured' };
  }

  try {
    const res = await supabase.functions.invoke('submit-score', {
      body: params,
    });

    if (res.error) {
      return { ok: false, error: res.error.message || 'Submission failed' };
    }

    return res.data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown network error';
    return { ok: false, error: msg };
  }
}

/**
 * Fetch leaderboard with rank assignment
 */
export async function fetchLeaderboard(
  type: 'all-time' | 'daily' | 'weekly',
  duration: Duration = 30,
  dailySeed?: string
): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  try {
    let query = supabase.from('typing_runs').select('id, user_id, username, duration, wpm, raw_wpm, accuracy, phrase_count, seed, created_at');

    if (type === 'daily') {
      const targetSeed = dailySeed || new Date().toISOString().slice(0, 10);
      query = query
        .eq('mode', 'daily')
        .eq('seed', targetSeed)
        .eq('verified', true)
        .order('wpm', { ascending: false })
        .order('accuracy', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);
    } else if (type === 'weekly') {
      const now = new Date();
      // UTC Monday start of week
      const day = now.getUTCDay();
      const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
      monday.setUTCHours(0, 0, 0, 0);

      query = query
        .eq('mode', 'classic')
        .eq('duration', duration)
        .eq('verified', true)
        .gte('created_at', monday.toISOString())
        .order('wpm', { ascending: false })
        .order('accuracy', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);
    } else {
      // All-time classic
      query = query
        .eq('mode', 'classic')
        .eq('duration', duration)
        .eq('verified', true)
        .order('wpm', { ascending: false })
        .order('accuracy', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((item, idx) => ({
      run_id: item.id,
      user_id: item.user_id,
      username: item.username,
      duration: item.duration as Duration,
      wpm: item.wpm,
      raw_wpm: item.raw_wpm,
      accuracy: item.accuracy,
      phrase_count: item.phrase_count,
      seed: item.seed,
      created_at: item.created_at,
      rank: idx + 1,
    }));
  } catch (err) {
    console.error('Fetch leaderboard error:', err);
    return [];
  }
}

/**
 * Fetch public user profile and achievements
 */
export async function fetchUserProfile(username: string): Promise<{
  profile: UserProfile | null;
  achievements: Achievement[];
  recentRuns: LeaderboardEntry[];
}> {
  if (!supabase) return { profile: null, achievements: [], recentRuns: [] };

  try {
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .single();

    if (profileErr || !profileData) {
      return { profile: null, achievements: [], recentRuns: [] };
    }

    // Fetch user verified runs
    const { data: runsData } = await supabase
      .from('typing_runs')
      .select('*')
      .eq('user_id', profileData.id)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(30);

    // Compute stats
    const bestWpmByDuration: Record<Duration, number> = { 15: 0, 30: 0, 60: 0, 120: 0 };
    let totalAccuracy = 0;
    let totalPhrases = 0;

    (runsData || []).forEach(r => {
      const d = r.duration as Duration;
      if (r.wpm > (bestWpmByDuration[d] || 0)) {
        bestWpmByDuration[d] = r.wpm;
      }
      totalAccuracy += Number(r.accuracy) || 0;
      totalPhrases += r.phrase_count || 0;
    });

    const totalRuns = runsData?.length || 0;
    const averageAccuracy = totalRuns > 0 ? Math.round((totalAccuracy / totalRuns) * 10) / 10 : 0;

    // Fetch achievements & user unlocked status
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    const { data: unlockedData } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', profileData.id);

    const unlockedMap = new Map((unlockedData || []).map(u => [u.achievement_id, u.unlocked_at]));

    const achievements: Achievement[] = (allAchievements || []).map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      badge_tier: a.badge_tier,
      unlocked: unlockedMap.has(a.id),
      unlocked_at: unlockedMap.get(a.id),
    }));

    const recentRuns: LeaderboardEntry[] = (runsData || []).map(r => ({
      run_id: r.id,
      user_id: r.user_id,
      username: r.username,
      duration: r.duration as Duration,
      wpm: r.wpm,
      raw_wpm: r.raw_wpm,
      accuracy: r.accuracy,
      phrase_count: r.phrase_count,
      seed: r.seed,
      created_at: r.created_at,
    }));

    return {
      profile: {
        id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        created_at: profileData.created_at,
        stats: {
          totalRuns,
          bestWpmByDuration,
          averageAccuracy,
          totalPhrases,
        },
      },
      achievements,
      recentRuns,
    };
  } catch (err) {
    console.error('Fetch user profile error:', err);
    return { profile: null, achievements: [], recentRuns: [] };
  }
}
