import { useRef } from 'react';
import type { Group } from 'three';

/**
 * CrabAnimations - Simple procedural animations for the crab
 *
 * Provides basic animations using rotation and position tweens
 * Dance: triggered by mug easter egg (10 clics)
 * Yawn: triggered by idle timeout (60s inactivity)
 */

/**
 * Dance animation - Rotate and bob up/down
 */
export function useDanceAnimation(
  groupRef: React.RefObject<Group>,
  shouldDance: boolean,
  duration: number = 2.0
) {
  const danceTimeRef = useRef(0);
  const originalYRef = useRef(0);

  return (delta: number) => {
    if (!shouldDance || !groupRef.current) {
      danceTimeRef.current = 0;
      return false; // Animation not playing
    }

    danceTimeRef.current += delta;

    if (danceTimeRef.current === delta) {
      // Store original Y position on first frame
      originalYRef.current = groupRef.current.position.y;
    }

    if (danceTimeRef.current >= duration) {
      // Reset to original position after duration
      groupRef.current.position.y = originalYRef.current;
      groupRef.current.rotation.y = 0;
      danceTimeRef.current = 0;
      return true; // Animation complete
    }

    // Spin around (2 full rotations)
    const spinSpeed = (Math.PI * 4) / duration;
    groupRef.current.rotation.y += spinSpeed * delta;

    // Bob up and down
    const bobFrequency = 8; // Hz
    const bobAmplitude = 0.1;
    const bob = Math.sin(danceTimeRef.current * bobFrequency * Math.PI * 2) * bobAmplitude;
    groupRef.current.position.y = originalYRef.current + bob;

    return false; // Animation still playing
  };
}

/**
 * Yawn animation - Subtle rotation left-right and slight tilt back
 */
export function useYawnAnimation(
  groupRef: React.RefObject<Group>,
  shouldYawn: boolean,
  duration: number = 1.5
) {
  const yawnTimeRef = useRef(0);
  const originalRotationRef = useRef({ x: 0, y: 0, z: 0 });

  return (delta: number) => {
    if (!shouldYawn || !groupRef.current) {
      yawnTimeRef.current = 0;
      return false;
    }

    yawnTimeRef.current += delta;

    if (yawnTimeRef.current === delta) {
      // Store original rotation
      originalRotationRef.current = {
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y,
        z: groupRef.current.rotation.z,
      };
    }

    if (yawnTimeRef.current >= duration) {
      // Reset to original rotation
      groupRef.current.rotation.x = originalRotationRef.current.x;
      groupRef.current.rotation.z = originalRotationRef.current.z;
      yawnTimeRef.current = 0;
      return true; // Animation complete
    }

    // Tilt back slightly (yawn motion)
    const progress = yawnTimeRef.current / duration;
    const tiltAngle = Math.sin(progress * Math.PI) * 0.15; // Tilt back ~8.6 degrees at peak
    groupRef.current.rotation.x = originalRotationRef.current.x - tiltAngle;

    // Slight side-to-side sway
    const swayAngle = Math.sin(progress * Math.PI * 2) * 0.05;
    groupRef.current.rotation.z = originalRotationRef.current.z + swayAngle;

    return false;
  };
}

/**
 * Idle timer - Detects inactivity and triggers yawn
 */
export function useIdleDetection(
  lastActivityTime: number,
  idleThresholdSeconds: number = 60
): boolean {
  const now = Date.now();
  const timeSinceActivity = (now - lastActivityTime) / 1000; // Convert to seconds
  return timeSinceActivity >= idleThresholdSeconds;
}
