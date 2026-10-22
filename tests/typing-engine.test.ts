import { describe, it, expect } from 'vitest';
import { 
  generateTargetText, 
  calculateStats, 
  getTodayUTC, 
  getDailySeedNumber,
  getTimeUntilNextUTCMidnight
} from '../src/lib/generator';

describe('Typing Engine & Text Generator', () => {
  it('generates deterministic target text for seed 0 (classic)', () => {
    const text1 = generateTargetText(100, 0);
    const text2 = generateTargetText(100, 0);
    expect(text1).toBe(text2);
    expect(text1.startsWith('When Yah')).toBe(true);
    expect(text1.length).toBeGreaterThan(50);
  });

  it('generates deterministic daily stream for a given UTC date', () => {
    const seedNum = getDailySeedNumber('2026-10-22');
    const textA = generateTargetText(300, seedNum);
    const textB = generateTargetText(300, seedNum);
    expect(textA).toBe(textB);
    expect(textA).toContain('When Yah');
  });

  it('generates consistent single-spaced phrases', () => {
    const text = generateTargetText(100, 0);
    expect(text.includes('  ')).toBe(false);
    expect(text.startsWith('When Yah When Yah')).toBe(true);
  });

  it('calculates 100% accuracy and correct WPM on flawless input', () => {
    const target = generateTargetText(100, 0);
    const typed = target.slice(0, 50); // 50 chars in 30 seconds (0.5 minute)
    const stats = calculateStats(typed, target, 30);

    expect(stats.correct).toBe(50);
    expect(stats.errors).toBe(0);
    expect(stats.accuracy).toBe(100);
    // 50 chars / 5 = 10 words. 10 words / 0.5 min = 20 WPM
    expect(stats.wpm).toBe(20);
    expect(stats.rawWpm).toBe(20);
  });

  it('calculates accuracy and penalizes errors on incorrect input', () => {
    const target = 'When Yah When Yah ';
    const typed =  'When Nah When Yah '; // 1 error ('N' instead of 'Y')
    const stats = calculateStats(typed, target, 15);

    expect(stats.correct).toBe(typed.length - 1);
    expect(stats.errors).toBe(1);
    expect(stats.accuracy).toBeLessThan(100);
    expect(stats.accuracy).toBeGreaterThan(90);
  });

  it('counts completed When Yah phrases accurately', () => {
    const target = 'When Yah When Yah When Yah';
    const stats = calculateStats(target, target, 10);
    expect(stats.phraseCount).toBe(3);
  });

  it('returns valid UTC date string format YYYY-MM-DD', () => {
    const today = getTodayUTC();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('computes positive countdown to next UTC midnight', () => {
    const { hours, minutes, seconds } = getTimeUntilNextUTCMidnight();
    expect(hours).toBeGreaterThanOrEqual(0);
    expect(hours).toBeLessThan(24);
    expect(minutes).toBeGreaterThanOrEqual(0);
    expect(minutes).toBeLessThan(60);
    expect(seconds).toBeGreaterThanOrEqual(0);
    expect(seconds).toBeLessThan(60);
  });
});
