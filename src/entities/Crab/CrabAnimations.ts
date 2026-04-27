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
 * Dance animation - Spin and bob up/down with a smooth fade-out.
 *
 * @param isDancingRef - Ref shared with Crab.tsx; set to true while the
 *   animation is running so the normal rotation-lerp is disabled.
 */
export function useDanceAnimation(
  groupRef: React.RefObject<Group | null>,
  isDancingRef: React.MutableRefObject<boolean>,
  duration: number = 2.0
) {
  const danceTimeRef = useRef(0);
  const groundYRef = useRef(0);

  return (delta: number) => {
    if (!groupRef.current) {
      danceTimeRef.current = 0;
      isDancingRef.current = false;
      return false;
    }

    // First frame: capture the controller's ground Y and mark as dancing.
    if (danceTimeRef.current === 0) {
      groundYRef.current = groupRef.current.position.y;
      isDancingRef.current = true;
    }

    danceTimeRef.current += delta;
    const t = danceTimeRef.current;

    if (t >= duration) {
      // Restore Y (will be overridden by controller on next frame anyway).
      groupRef.current.position.y = groundYRef.current;
      // Do NOT reset rotation.y - let the normal lerp smoothly return to the
      // controller's facing direction on the next frame.
      danceTimeRef.current = 0;
      isDancingRef.current = false;
      return true; // Animation complete
    }

    // Continuous spin (2 full rotations over duration).
    const spinSpeed = (Math.PI * 4) / duration;
    groupRef.current.rotation.y += spinSpeed * delta;

    // Bob up/down with fade-out in the last 20 % so the landing is smooth.
    const fadeOut = Math.min(1, (duration - t) / (duration * 0.2));
    const bobFrequency = 8;
    const bobAmplitude = 0.1;
    const bob = Math.sin(t * bobFrequency * Math.PI * 2) * bobAmplitude * fadeOut;
    groupRef.current.position.y = groundYRef.current + bob;

    return false; // Animation still playing
  };
}

/**
 * Yawn animation - Subtle rotation left-right and slight tilt back
 */
export function useYawnAnimation(
  groupRef: React.RefObject<Group | null>,
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

/**
 * Greeting animation - Forward bow on first load.
 * Smoothly tilts the crab toward the camera then returns to upright.
 */
export function useGreetingAnimation(
  groupRef: React.RefObject<Group | null>,
  shouldGreet: boolean,
  duration: number = 1.5
) {
  const greetTimeRef = useRef(0);
  const originalRotXRef = useRef(0);

  return (delta: number) => {
    if (!shouldGreet || !groupRef.current) {
      greetTimeRef.current = 0;
      return false;
    }

    if (greetTimeRef.current === 0) {
      // Capture original X rotation on the very first tick
      originalRotXRef.current = groupRef.current.rotation.x;
    }

    greetTimeRef.current += delta;

    if (greetTimeRef.current >= duration) {
      groupRef.current.rotation.x = originalRotXRef.current;
      greetTimeRef.current = 0;
      return true; // Animation complete
    }

    // Smooth bow: sin curve over [0, π] → 0 → peak → 0
    const progress = greetTimeRef.current / duration;
    const bowAngle = Math.sin(progress * Math.PI) * 0.3; // ~17° max bow
    groupRef.current.rotation.x = originalRotXRef.current - bowAngle;

    return false;
  };
}
