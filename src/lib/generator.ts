import { TypingStats } from '../types/typing';

export const PHRASE = 'When Yah';

/**
 * Deterministic PRNG and text stream generator.
 * Produces identical stream across client and Edge Functions for reproducible tests.
 */
export function generateTargetText(length = 3000, seed = 0): string {
  let out = '';
  let x = (seed + 0x6D2B79F5) >>> 0;
  while (out.length < length) {
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    const extraSpace = ((x ^ (x >>> 14)) >>> 0) % 17 === 0;
    out += PHRASE + (extraSpace ? '  ' : ' ');
  }
  return out.trimEnd();
}

/**
 * Computes live or final typing stats.
 * Uses standard typing test formula: (chars / 5) / elapsedMinutes.
 */
export function calculateStats(typed: string, target: string, elapsedSeconds: number): TypingStats {
  let correct = 0;
  const compareLen = Math.min(typed.length, target.length);
  for (let i = 0; i < compareLen; i++) {
    if (typed[i] === target[i]) {
      correct++;
    }
  }

  const elapsedMinutes = Math.max(elapsedSeconds, 0.5) / 60;
  const rawWpm = Math.round((typed.length / 5) / elapsedMinutes);
  const wpm = Math.round((correct / 5) / elapsedMinutes);
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 1000) / 10 : 100;
  const errors = typed.length - correct;
  const phraseCount = (typed.match(/When Yah/g) || []).length;

  return {
    correct,
    errors,
    wpm,
    rawWpm,
    accuracy,
    phraseCount,
  };
}

export function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailySeedNumber(dateStr: string): number {
  return Number(dateStr.replaceAll('-', '')) || 20261022;
}

export function getTimeUntilNextUTCMidnight(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const nextUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diffMs = Math.max(0, nextUTC.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}
