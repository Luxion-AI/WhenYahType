export type Duration = 15 | 30 | 60 | 120;
export const DURATIONS: Duration[] = [15, 30, 60, 120];

export type Mode = 'classic' | 'daily';

export interface TypingStats {
  correct: number;
  errors: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  phraseCount: number;
}

export interface RunTicket {
  ticketId: string;
  mode: Mode;
  duration: Duration;
  seed: string;
  expiresAt: string;
  issuedAt: string;
}

export type SubmissionStatus = 
  | 'idle' 
  | 'requesting_ticket' 
  | 'in_progress' 
  | 'validating' 
  | 'verified' 
  | 'rejected' 
  | 'offline_saved';

export interface RunResult {
  runId?: string;
  duration: Duration;
  mode: Mode;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  phraseCount: number;
  correct: number;
  errors: number;
  elapsedMs: number;
  bestCombo?: number;
  isPersonalBest?: boolean;
  status: SubmissionStatus;
  errorMessage?: string;
  unlockedAchievements?: string[];
  createdAt: string;
}

export interface LeaderboardEntry {
  run_id?: string;
  user_id: string;
  username: string;
  duration: Duration;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  phrase_count: number;
  seed?: string;
  created_at: string;
  rank?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'meme';
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  stats?: {
    totalRuns: number;
    bestWpmByDuration: Record<Duration, number>;
    averageAccuracy: number;
    totalPhrases: number;
  };
}

export interface TypingSettings {
  soundEnabled: boolean;
  soundVolume: number;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  caretStyle: 'line' | 'block' | 'underline' | 'off';
  smoothCaret: boolean;
}
