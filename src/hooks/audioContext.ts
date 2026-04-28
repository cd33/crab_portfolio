/**
 * audioContext.ts - Shared AudioContext singleton
 *
 * iOS Safari (and some Android browsers) require AudioContext to be created
 * AND resumed inside a user-gesture handler. Sharing a single instance avoids
 * conflicts between useAmbientMusic and useSound.
 *
 * Usage:
 *   import { resumeAudioContext } from '@hooks/audioContext';
 *   // Inside a user-gesture handler or before play():
 *   await resumeAudioContext();
 */

let _ctx: AudioContext | null = null;

/**
 * Returns the shared AudioContext, creating it lazily on first call.
 * Must only be called in a browser context (after mount).
 */
export function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext();
  }
  return _ctx;
}

/**
 * Resumes the shared AudioContext if it is in a suspended state.
 * Call this inside any user-gesture handler (click, touchstart, keydown)
 * to unblock audio playback on iOS Safari.
 */
export async function resumeAudioContext(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {
    // AudioContext not available (e.g. SSR or very old browser)
  }
}
