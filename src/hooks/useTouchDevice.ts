import { useState } from 'react';

/**
 * Hook to detect if the device supports touch input
 * Returns true for mobile/tablet devices
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice] = useState(() => {
    // Check for touch support
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is legacy IE
      navigator.msMaxTouchPoints > 0;

    return hasTouch;
  });

  return isTouchDevice;
}
