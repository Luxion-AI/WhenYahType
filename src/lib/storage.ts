import { Duration, RunResult, TypingSettings } from '../types/typing';

const STORAGE_KEYS = {
  SETTINGS: 'wyt_settings_v1',
  GUEST_USERNAME: 'wyt_guest_username_v1',
  LOCAL_RUNS: 'wyt_local_runs_v1',
  PERSONAL_BESTS: 'wyt_personal_bests_v1',
};

export const DEFAULT_SETTINGS: TypingSettings = {
  soundEnabled: true,
  soundVolume: 0.3,
  fontSize: 'lg',
  caretStyle: 'line',
  smoothCaret: true,
};

export function loadSettings(): TypingSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TypingSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function getGuestUsername(): string {
  try {
    let name = localStorage.getItem(STORAGE_KEYS.GUEST_USERNAME);
    if (!name) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      name = `yah_guest_${rand}`;
      localStorage.setItem(STORAGE_KEYS.GUEST_USERNAME, name);
    }
    return name;
  } catch {
    return 'yah_guest_404';
  }
}

export function setGuestUsername(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GUEST_USERNAME, name);
  } catch {
    // Ignore
  }
}

export function getPersonalBests(): Record<Duration, number> {
  const defaults: Record<Duration, number> = { 15: 0, 30: 0, 60: 0, 120: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_BESTS);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function updatePersonalBest(duration: Duration, wpm: number): boolean {
  try {
    const pbs = getPersonalBests();
    if (wpm > (pbs[duration] || 0)) {
      pbs[duration] = wpm;
      localStorage.setItem(STORAGE_KEYS.PERSONAL_BESTS, JSON.stringify(pbs));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getLocalRuns(): RunResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_RUNS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalRun(run: RunResult): void {
  try {
    const runs = getLocalRuns();
    runs.unshift(run);
    // Keep last 100 runs
    const trimmed = runs.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.LOCAL_RUNS, JSON.stringify(trimmed));
  } catch {
    // Ignore
  }
}
