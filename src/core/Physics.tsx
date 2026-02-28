import { Vector3 } from 'three';

/**
 * Check if position is within scene bounds
 */
export function isWithinBounds(
  position: Vector3,
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  }
): boolean {
  return (
    position.x >= bounds.minX &&
    position.x <= bounds.maxX &&
    position.z >= bounds.minZ &&
    position.z <= bounds.maxZ
  );
}
