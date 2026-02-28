import type { InteractableObject } from '@/types';
import { useCrabContext } from '@core/useCrabContext';
import { useMemo } from 'react';
import { Vector3 } from 'three';

/**
 * Hook to detect interactions between crab and nearby objects
 * Returns the closest interactive object within range
 */
export function useInteraction(objects: InteractableObject[]) {
  const { position: crabPosition } = useCrabContext();

  const interactionState = useMemo(() => {
    const tempPos = new Vector3();
    const distances: Array<{ object: InteractableObject; distance: number }> = [];

    // Calculate distances to all objects
    objects.forEach((obj) => {
      tempPos.copy(obj.position);
      const distance = crabPosition.distanceTo(tempPos);
      distances.push({ object: obj, distance });
    });

    // Sort by distance
    distances.sort((a, b) => a.distance - b.distance);

    // Find objects within interaction radius
    const nearbyObjects = distances.filter((d) => d.distance <= d.object.interactionRadius);

    const closest = nearbyObjects.length > 0 ? nearbyObjects[0] : null;

    return {
      nearbyObjects: nearbyObjects.map((d) => d.object),
      closestObject: closest?.object || null,
      canInteract: closest !== null,
      distanceToClosest: closest?.distance || Infinity,
    };
  }, [crabPosition, objects]);

  return interactionState;
}
