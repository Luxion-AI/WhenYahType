export const PHRASE = 'When Yah';

/**
 * Deterministic PRNG and text stream generator.
 * Uses a Mulberry32-inspired fast 32-bit state generator to produce
 * identical phrase spacing patterns across frontend and server.
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

export function computeVerifiedStats(typed: string, target: string, elapsedMs: number) {
  let correct = 0;
  const compareLength = Math.min(typed.length, target.length);
  for (let i = 0; i < compareLength; i++) {
    if (typed[i] === target[i]) {
      correct++;
    }
  }

  const elapsedMinutes = Math.max(elapsedMs / 60000, 1 / 60);
  const rawWpm = Math.round((typed.length / 5) / elapsedMinutes);
  const wpm = Math.round((correct / 5) / elapsedMinutes);
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 10000) / 100 : 100;
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
