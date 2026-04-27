import { useState } from 'react';

interface WebGLDetection {
  /** Whether WebGL is supported */
  isSupported: boolean;
  /** WebGL version (1 or 2, or null if not supported) */
  version: 1 | 2 | null;
  /** Whether detection is complete */
  isLoading: boolean;
  /** Error message if detection failed */
  error: string | null;
}

/**
 * Detects WebGL support synchronously.
 * Tests for WebGL 2.0 first, then falls back to WebGL 1.0.
 */
function detectWebGL(): WebGLDetection {
  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = document.createElement('canvas');

    const gl2 = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
    if (gl2) {
      return { isSupported: true, version: 2, isLoading: false, error: null };
    }

    const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl1) {
      return { isSupported: true, version: 1, isLoading: false, error: null };
    }

    return {
      isSupported: false,
      version: null,
      isLoading: false,
      error: 'WebGL is not supported by your browser or device.',
    };
  } catch (err) {
    return {
      isSupported: false,
      version: null,
      isLoading: false,
      error: err instanceof Error ? err.message : 'Unknown error during WebGL detection',
    };
  } finally {
    canvas?.remove();
  }
}

/**
 * Hook to detect WebGL support and version.
 * Detection is synchronous so `isLoading` is always false after mount.
 *
 * @returns WebGLDetection object with support status and version
 */
export function useWebGLDetection(): WebGLDetection {
  // Lazy initializer runs once during mount - no useEffect needed.
  const [detection] = useState<WebGLDetection>(detectWebGL);
  return detection;
}
