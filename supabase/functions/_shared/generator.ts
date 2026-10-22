export const PHRASE = 'When Yah';

/**
 * Deterministic text stream generator.
 * Produces clean single-space separated phrases across client and server.
 */
export function generateTargetText(length = 3000, _seed = 0): string {
  let out = '';
  while (out.length < length) {
    out += PHRASE + ' ';
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
