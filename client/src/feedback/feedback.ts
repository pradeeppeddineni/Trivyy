import { getFeedbackPrefs } from './prefs';

export type FeedbackKind = 'correct' | 'wrong';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioCtx !== null) return audioCtx;
  try {
    const Ctor =
      typeof window !== 'undefined'
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (Ctor == null) return null;
    audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
}

export function playTone(kind: FeedbackKind): void {
  try {
    const ctx = getAudioContext();
    if (ctx === null) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    if (kind === 'correct') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.18);
    } else {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.22);
    }
  } catch {
    // audio unavailable; silently ignore
  }
}

export function vibrate(kind: FeedbackKind): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    const pattern = kind === 'correct' ? [80] : [80, 60, 80];
    navigator.vibrate(pattern);
  } catch {
    // vibration unavailable; silently ignore
  }
}

export function signal(kind: FeedbackKind): void {
  try {
    const prefs = getFeedbackPrefs();
    if (prefs.sound) playTone(kind);
    if (prefs.haptics) vibrate(kind);
  } catch {
    // silently ignore
  }
}
