import { afterEach, describe, expect, it, vi } from 'vitest';
import { vibrate } from '../../src/utils/haptic';

describe('vibrate()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls navigator.vibrate with the given duration', () => {
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
      writable: true,
    });

    vibrate(50);
    expect(vibrateSpy).toHaveBeenCalledWith(50);
  });

  it('uses 30 ms by default', () => {
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
      writable: true,
    });

    vibrate();
    expect(vibrateSpy).toHaveBeenCalledWith(30);
  });

  it('does not throw when navigator.vibrate is absent', () => {
    const original = navigator.vibrate;
    // @ts-expect-error intentionally removing vibrate
    delete navigator.vibrate;

    expect(() => vibrate(50)).not.toThrow();

    // Restore
    Object.defineProperty(navigator, 'vibrate', {
      value: original,
      configurable: true,
      writable: true,
    });
  });

  it('does not throw when navigator.vibrate throws', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: () => {
        throw new Error('Vibration API error');
      },
      configurable: true,
      writable: true,
    });

    expect(() => vibrate(50)).not.toThrow();
  });
});
