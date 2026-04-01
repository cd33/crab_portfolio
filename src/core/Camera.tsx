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

  // Pre-allocated vectors - zero GC pressure per frame
  const targetPosition = useMemo(() => new Vector3(0, CAMERA.HEIGHT, CAMERA.DISTANCE), []);
  const targetLookAt = useMemo(() => new Vector3(0, CAMERA.LOOK_AT_HEIGHT, 0), []);
  const prevCrabPosition = useMemo(() => new Vector3(), []);

  // Avoid recalculating if crab hasn't moved (compares Vector3 directly)
  const hasMoved = useRef(true);

  useFrame(() => {
    if (!prevCrabPosition.equals(crabPosition)) {
      targetPosition.set(
        crabPosition.x,
        crabPosition.y + CAMERA.HEIGHT,
        crabPosition.z + CAMERA.DISTANCE
      );
      targetLookAt.set(crabPosition.x, crabPosition.y + CAMERA.LOOK_AT_HEIGHT, crabPosition.z);
      prevCrabPosition.copy(crabPosition);
      hasMoved.current = true;
    }

    // Always lerp for smooth damping, even when crab stops
    camera.position.lerp(targetPosition, CAMERA.DAMPING);
    camera.lookAt(targetLookAt);
  });

  return null;
}
