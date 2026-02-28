import { useKeyboard } from '@/hooks/useKeyboard';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useKeyboard', () => {
  beforeEach(() => {
    // Clear any previous event listeners
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any remaining event listeners
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'm' }));
    });
  });

  it('should initialize with all keys as false', () => {
    const { result } = renderHook(() => useKeyboard());

    expect(result.current.forward).toBe(false);
    expect(result.current.backward).toBe(false);
    expect(result.current.left).toBe(false);
    expect(result.current.right).toBe(false);
    expect(result.current.interact).toBe(false);
    expect(result.current.escape).toBe(false);
    expect(result.current.map).toBe(false);
  });

  it('should detect forward key press (W)', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    });

    expect(result.current.forward).toBe(true);
  });

  it('should detect forward key press (ArrowUp)', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    expect(result.current.forward).toBe(true);
  });

  it('should detect backward key press (S)', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    });

    expect(result.current.backward).toBe(true);
  });

  it('should detect left key press (A)', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    expect(result.current.left).toBe(true);
  });

  it('should detect right key press (D)', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    });

    expect(result.current.right).toBe(true);
  });

  it('should detect interact key press (E)', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    });

    expect(result.current.interact).toBe(true);
  });

  it('should detect escape key press', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.escape).toBe(true);
  });

  it('should detect map key press (M)', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
    });

    expect(result.current.map).toBe(true);
  });

  it('should reset key state on keyup', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    });

    expect(result.current.forward).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
    });

    expect(result.current.forward).toBe(false);
  });

  it('should handle multiple simultaneous key presses', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    });

    expect(result.current.forward).toBe(true);
    expect(result.current.right).toBe(true);
  });

  it('should be case-insensitive for letter keys', () => {
    const { result } = renderHook(() => useKeyboard());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'W' }));
    });

    expect(result.current.forward).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboard());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
