import { useFrame, useThree } from '@react-three/fiber';
import { CAMERA } from '@utils/constants';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { useCrabContext } from './useCrabContext';

/**
 * Camera Component that follows the crab with smooth damping
 * Automatically updates position based on crab's position
 */
export function Camera() {
  const { camera } = useThree();
  const { position: crabPosition } = useCrabContext();

  // Memoize Vector3 instances to avoid recreation every frame
  const targetPosition = useMemo(() => new Vector3(0, CAMERA.HEIGHT, CAMERA.DISTANCE), []);
  const targetLookAt = useMemo(() => new Vector3(0, CAMERA.LOOK_AT_HEIGHT, 0), []);

  // Track previous position to avoid unnecessary updates
  const prevCrabPosition = useRef({ x: 0, y: 0, z: 0 });

  useFrame(() => {
    // Only update if crab has moved
    const moved =
      prevCrabPosition.current.x !== crabPosition.x ||
      prevCrabPosition.current.y !== crabPosition.y ||
      prevCrabPosition.current.z !== crabPosition.z;

    if (moved) {
      // Calculate target camera position behind crab
      targetPosition.set(
        crabPosition.x,
        crabPosition.y + CAMERA.HEIGHT,
        crabPosition.z + CAMERA.DISTANCE
      );

      // Calculate look-at point slightly above crab
      targetLookAt.set(crabPosition.x, crabPosition.y + CAMERA.LOOK_AT_HEIGHT, crabPosition.z);

      // Update previous position
      prevCrabPosition.current = { ...crabPosition };
    }

    // Smooth camera movement with damping
    camera.position.lerp(targetPosition, CAMERA.DAMPING);
    camera.lookAt(targetLookAt);
  });

  return null;
}
