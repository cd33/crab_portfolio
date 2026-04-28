/**
 * haptic.ts - Safe wrapper for the Vibration API
 *
 * `navigator.vibrate` is not available on iOS Safari (and may be absent on
 * desktop browsers). All calls are guarded so they fail silently.
 */

/**
 * Trigger a short haptic pulse.
 * @param ms Duration in milliseconds (default 30)
 */
export function vibrate(ms: number = 30): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    // Silently ignore - Vibration API not available
  }
}
