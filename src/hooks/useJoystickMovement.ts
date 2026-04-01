import { useCallback, useRef } from 'react';
import { Vector3 } from 'three';

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
  // Pre-allocated Vector3 to avoid GC pressure - reused every frame
  const directionRef = useRef(new Vector3());

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
   * Returns a real Vector3 compatible with CrabController.copy()
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
    // Joystick up = move forward, joystick down = move backward
    return directionRef.current.set(x, 0, y);
  }, []);

  return {
    handleJoystickMove,
    handleJoystickStop,
    getMovementDirection,
    isActive: () => isActiveRef.current,
  };
}
