import type { InteractableObject } from '@/types';
import { useCrabContext } from '@core/useCrabContext';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';

/**
 * Result type for interaction state
 */
export interface InteractionState {
  nearbyObjects: InteractableObject[];
  closestObject: InteractableObject | null;
  canInteract: boolean;
  distanceToClosest: number;
}

const EMPTY_STATE: InteractionState = {
  nearbyObjects: [],
  closestObject: null,
  canInteract: false,
  distanceToClosest: Infinity,
};

/**
 * Hook to detect interactions between crab and nearby interactable objects.
 *
 * Uses `useFrame` (Three.js render loop) to read the crab's mutable Vector3
 * position on every frame, avoiding the stale-ref bug of `useMemo`.
 * Throttled to ~10 Hz (every 6th frame at 60fps) to avoid expensive checks
 * each frame.
 *
 * Finding the closest object is O(n) - no sort needed.
 *
 * Must be called inside a @react-three/fiber <Canvas> tree.
 */
export function useInteraction(objects: InteractableObject[]): InteractionState {
  const { position: crabPosition } = useCrabContext();
  const [state, setState] = useState<InteractionState>(EMPTY_STATE);
  const frameCounter = useRef(0);
  // Keep a ref to the last emitted state to avoid unnecessary setState calls
  const prevStateRef = useRef<InteractionState>(EMPTY_STATE);

  useFrame(() => {
    // Throttle: run every 6th frame (~10Hz at 60fps)
    frameCounter.current++;
    if (frameCounter.current % 6 !== 0) return;

    if (objects.length === 0) {
      if (prevStateRef.current !== EMPTY_STATE) {
        prevStateRef.current = EMPTY_STATE;
        setState(EMPTY_STATE);
      }
      return;
    }

    // O(n) single pass: find closest within radius
    const nearbyObjects: InteractableObject[] = [];
    let closestObject: InteractableObject | null = null;
    let minDistance = Infinity;

    for (const obj of objects) {
      const distance = crabPosition.distanceTo(obj.position);
      if (distance <= obj.interactionRadius) {
        nearbyObjects.push(obj);
        if (distance < minDistance) {
          minDistance = distance;
          closestObject = obj;
        }
      }
    }

    const next: InteractionState = {
      nearbyObjects,
      closestObject,
      canInteract: closestObject !== null,
      distanceToClosest: closestObject !== null ? minDistance : Infinity,
    };

    // Only trigger re-render when result actually changes
    const prev = prevStateRef.current;
    if (
      next.closestObject !== prev.closestObject ||
      next.nearbyObjects.length !== prev.nearbyObjects.length ||
      next.distanceToClosest !== prev.distanceToClosest
    ) {
      prevStateRef.current = next;
      setState(next);
    }
  });

  return state;
}
