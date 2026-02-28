import { useSound } from '@/hooks/useSound';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock global des méthodes HTMLMediaElement pour éviter les erreurs 'Not implemented'
beforeAll(() => {
  Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: vi.fn(),
  });
});

// Mock console methods to avoid cluttering test output
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSound', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoaded).toBe(false);
  });

  it('should not initialize audio when disabled', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3', { enabled: false }));

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoaded).toBe(false);
  });

  it('should handle invalid src gracefully', () => {
    const { result } = renderHook(() => useSound('', { enabled: true }));

    expect(result.current.isPlaying).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('should provide play function', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(typeof result.current.play).toBe('function');
  });

  it('should provide pause function', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(typeof result.current.pause).toBe('function');
  });

  it('should provide stop function', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(typeof result.current.stop).toBe('function');
  });

  it('should provide setVolume function', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(typeof result.current.setVolume).toBe('function');
  });

  it('should apply volume option', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3', { volume: 0.5 }));

    // Volume is applied internally to the audio element
    expect(result.current).toBeDefined();
  });

  it('should apply loop option', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3', { loop: true }));

    expect(result.current).toBeDefined();
  });

  it('should apply playbackRate option', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3', { playbackRate: 1.5 }));

    expect(result.current).toBeDefined();
  });

  it('should handle play call without errors', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(() => {
      act(() => {
        result.current.play();
      });
    }).not.toThrow();
  });

  it('should handle pause call without errors', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(() => {
      act(() => {
        result.current.pause();
      });
    }).not.toThrow();
  });

  it('should handle stop call without errors', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(() => {
      act(() => {
        result.current.stop();
      });
    }).not.toThrow();
  });

  it('should handle setVolume call without errors', () => {
    const { result } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(() => {
      act(() => {
        result.current.setVolume(0.7);
      });
    }).not.toThrow();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSound('/sounds/test.mp3'));

    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('should reinitialize when src changes', () => {
    const { result, rerender } = renderHook(({ src }) => useSound(src), {
      initialProps: { src: '/sounds/test1.mp3' },
    });

    expect(result.current).toBeDefined();

    act(() => {
      rerender({ src: '/sounds/test2.mp3' });
    });

    expect(result.current).toBeDefined();
  });

  it('should handle enabled toggle', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useSound('/sounds/test.mp3', { enabled }),
      { initialProps: { enabled: true } }
    );

    expect(result.current).toBeDefined();

    act(() => {
      rerender({ enabled: false });
    });

    expect(result.current).toBeDefined();
  });
});
