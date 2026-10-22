import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getPersonalBests, 
  updatePersonalBest, 
  loadSettings, 
  saveSettings, 
  getGuestUsername,
  DEFAULT_SETTINGS
} from '../src/lib/storage';

describe('Storage & Persistence Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes default settings when empty', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings.soundEnabled).toBe(true);
    expect(settings.fontSize).toBe('lg');
  });

  it('saves and reloads custom settings', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      soundEnabled: false,
      fontSize: 'xl',
      caretStyle: 'block',
    });
    const reloaded = loadSettings();
    expect(reloaded.soundEnabled).toBe(false);
    expect(reloaded.fontSize).toBe('xl');
    expect(reloaded.caretStyle).toBe('block');
  });

  it('generates and persists a stable guest username', () => {
    const name1 = getGuestUsername();
    const name2 = getGuestUsername();
    expect(name1).toBe(name2);
    expect(name1.startsWith('yah_guest_')).toBe(true);
  });

  it('updates personal bests only when improved', () => {
    const initial = getPersonalBests();
    expect(initial[30]).toBe(0);

    const firstRunPb = updatePersonalBest(30, 85);
    expect(firstRunPb).toBe(true);
    expect(getPersonalBests()[30]).toBe(85);

    // Slower run does NOT overwrite personal best
    const slowerRun = updatePersonalBest(30, 70);
    expect(slowerRun).toBe(false);
    expect(getPersonalBests()[30]).toBe(85);

    // Faster run overwrites personal best
    const fasterRun = updatePersonalBest(30, 95);
    expect(fasterRun).toBe(true);
    expect(getPersonalBests()[30]).toBe(95);
  });
});
