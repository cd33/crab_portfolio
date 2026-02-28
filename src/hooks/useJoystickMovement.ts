import { useCallback, useRef } from 'react';
import type { Vector3 } from 'three';

interface JoystickInput {
  x: number;
  y: number;
}

/**
 * useJoystickMovement - Converts joystick input to 3D movement vector
 * Mimics keyboard WASD behavior for mobile touch controls
 */
export function useJoystickMovement() {
  const joystickInputRef = useRef<JoystickInput>({ x: 0, y: 0 });
  const isActiveRef = useRef(false);

  const handleJoystickMove = useCallback((position: JoystickInput) => {
    joystickInputRef.current = position;
    isActiveRef.current = true;
  }, []);

  const handleJoystickStop = useCallback(() => {
    joystickInputRef.current = { x: 0, y: 0 };
    isActiveRef.current = false;
  }, []);

  /**
   * Get movement direction from joystick
   * Returns normalized vector compatible with CrabController
   */
  const getMovementDirection = useCallback((): Vector3 | null => {
    if (!isActiveRef.current) return null;

    const { x, y } = joystickInputRef.current;

    // Dead zone to prevent drift
    const deadZone = 0.1;
    if (Math.abs(x) < deadZone && Math.abs(y) < deadZone) {
      return null;
    }

    // Convert joystick Y to 3D Z (forward/backward)
    // Invert Y because joystick down = move forward in 3D
    return {
      x,
      y: 0,
      z: -y, // Negative because joystick down = forward
    } as Vector3;
  }, []);

  return {
    handleJoystickMove,
    handleJoystickStop,
    getMovementDirection,
    isActive: () => isActiveRef.current,
  };
}
