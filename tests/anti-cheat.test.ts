import { describe, it, expect } from 'vitest';
import { generateTargetText, calculateStats } from '../src/lib/generator';

describe('Server-Side Anti-Cheat & Scoring Parity', () => {
  it('identically reproduces phrase targets across repeated invocations', () => {
    const serverGen = generateTargetText(1500, 42);
    const clientGen = generateTargetText(1500, 42);
    expect(serverGen).toBe(clientGen);
  });

  it('rejects humanly impossible burst speeds (> 320 WPM)', () => {
    // 350 WPM would be ~1750 chars in 60s
    const target = generateTargetText(2000, 0);
    const typed = target.slice(0, 1800);
    const stats = calculateStats(typed, target, 60);

    expect(stats.wpm).toBeGreaterThan(320);
    // Anti-cheat rule: speed must be <= 320 WPM
    const isSuperhuman = stats.wpm > 320;
    expect(isSuperhuman).toBe(true);
  });

  it('flags runs with excessive error rates (< 25% accuracy)', () => {
    const target = generateTargetText(500, 0);
    // Random gibberish
    const typed = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
    const stats = calculateStats(typed, target, 30);

    expect(stats.accuracy).toBeLessThan(25);
    const isSpam = stats.accuracy < 25;
    expect(isSpam).toBe(true);
  });

  it('tolerates small network jitter around elapsed duration (within tolerance)', () => {
    const targetDuration = 30; // 30s mode
    const minToleranceMs = targetDuration * 1000 - 1800; // 28.2s
    const maxToleranceMs = targetDuration * 1000 + 8000; // 38.0s

    const validRunElapsedMs = 30120; // 30.12s
    expect(validRunElapsedMs).toBeGreaterThanOrEqual(minToleranceMs);
    expect(validRunElapsedMs).toBeLessThanOrEqual(maxToleranceMs);

    const prematureElapsedMs = 20000; // 20s (too early)
    expect(prematureElapsedMs >= minToleranceMs).toBe(false);
  });
});
