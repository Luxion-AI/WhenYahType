// Pure Web Audio API Mechanical Keyboard Sound Synthesizer
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export type SoundType = 'correct' | 'error' | 'space' | 'restart' | 'combo_tier_up' | 'fanfare' | 'pb';

export function playKeyClick(type: SoundType, volume = 0.2) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'correct') {
      // Crisp subtle tactile click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
      gain.gain.setValueAtTime(volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'space') {
      // Deeper thud for spacebar
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
      gain.gain.setValueAtTime(volume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'error') {
      // Soft dull buzz for error
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.07);
      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'restart') {
      // Ascending chime for restart
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'combo_tier_up') {
      // Retro 3-tone ascending arpeggio for combo tier upgrade
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.type = 'square';
        const start = now + idx * 0.05;
        noteOsc.frequency.setValueAtTime(freq, start);
        noteGain.gain.setValueAtTime(volume * 0.25, start);
        noteGain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
        noteOsc.start(start);
        noteOsc.stop(start + 0.09);
      });
    } else if (type === 'fanfare' || type === 'pb') {
      // Triumphant 8-bit fanfare
      const melody = [
        { f: 523.25, d: 0.08 },
        { f: 659.25, d: 0.08 },
        { f: 783.99, d: 0.08 },
        { f: 1046.5, d: 0.22 },
      ];
      let offset = 0;
      melody.forEach(({ f, d }) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.type = 'triangle';
        const start = now + offset;
        noteOsc.frequency.setValueAtTime(f, start);
        noteGain.gain.setValueAtTime(volume * 0.35, start);
        noteGain.gain.exponentialRampToValueAtTime(0.001, start + d);
        noteOsc.start(start);
        noteOsc.stop(start + d);
        offset += d * 0.85;
      });
    }
  } catch {
    // Ignore audio failures if browser blocks autoplay
  }
}
