import { useEffect, useState } from 'react';

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
 * Hook to detect WebGL support and version
 * Tests for WebGL 2.0 first, then falls back to WebGL 1.0
 *
 * @returns WebGLDetection object with support status and version
 */
export function useWebGLDetection(): WebGLDetection {
  const [detection, setDetection] = useState<WebGLDetection>({
    isSupported: false,
    version: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null;

    try {
      // Create temporary canvas for testing
      canvas = document.createElement('canvas');

      // Test WebGL 2.0
      const gl2 = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
      if (gl2) {
        setDetection({
          isSupported: true,
          version: 2,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Fallback to WebGL 1.0
      const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl1) {
        setDetection({
          isSupported: true,
          version: 1,
          isLoading: false,
          error: null,
        });
        return;
      }

      // No WebGL support
      setDetection({
        isSupported: false,
        version: null,
        isLoading: false,
        error: 'WebGL is not supported by your browser or device.',
      });
    } catch (err) {
      // Error during detection
      setDetection({
        isSupported: false,
        version: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error during WebGL detection',
      });
    } finally {
      // Cleanup canvas
      if (canvas) {
        canvas.remove();
      }
    }
  }, []);

  return detection;
}
