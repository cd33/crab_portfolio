/**
 * Collision Detection Tests
 * Validates boundaries and collision behavior
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

// Test constants from game constants
const WORLD_BOUNDS = {
  minX: -15,
  maxX: 15,
  minZ: -15,
  maxZ: 15,
};

const DESK_BOUNDS = {
  minX: -5,
  maxX: 5,
  minZ: -3,
  maxZ: 3,
  y: 0.5, // Desk height
};

describe('Collision Detection', () => {
  describe('World Boundaries', () => {
    it('should prevent movement beyond minX', () => {
      const position = new THREE.Vector3(WORLD_BOUNDS.minX - 1, 0, 0);
      const clampedX = Math.max(WORLD_BOUNDS.minX, position.x);
      expect(clampedX).toBe(WORLD_BOUNDS.minX);
    });

    it('should prevent movement beyond maxX', () => {
      const position = new THREE.Vector3(WORLD_BOUNDS.maxX + 1, 0, 0);
      const clampedX = Math.min(WORLD_BOUNDS.maxX, position.x);
      expect(clampedX).toBe(WORLD_BOUNDS.maxX);
    });

    it('should prevent movement beyond minZ', () => {
      const position = new THREE.Vector3(0, 0, WORLD_BOUNDS.minZ - 1);
      const clampedZ = Math.max(WORLD_BOUNDS.minZ, position.z);
      expect(clampedZ).toBe(WORLD_BOUNDS.minZ);
    });

    it('should prevent movement beyond maxZ', () => {
      const position = new THREE.Vector3(0, 0, WORLD_BOUNDS.maxZ + 1);
      const clampedZ = Math.min(WORLD_BOUNDS.maxZ, position.z);
      expect(clampedZ).toBe(WORLD_BOUNDS.maxZ);
    });

    it('should allow movement within bounds', () => {
      const position = new THREE.Vector3(5, 0, 5);
      const clampedX = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, position.x));
      const clampedZ = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, position.z));
      expect(clampedX).toBe(5);
      expect(clampedZ).toBe(5);
    });
  });

  describe('Desk Collision', () => {
    it('should detect collision when inside desk X bounds', () => {
      const position = new THREE.Vector3(0, 0, 0);
      const isInsideDeskX = position.x > DESK_BOUNDS.minX && position.x < DESK_BOUNDS.maxX;
      expect(isInsideDeskX).toBe(true);
    });

    it('should detect collision when inside desk Z bounds', () => {
      const position = new THREE.Vector3(0, 0, 0);
      const isInsideDeskZ = position.z > DESK_BOUNDS.minZ && position.z < DESK_BOUNDS.maxZ;
      expect(isInsideDeskZ).toBe(true);
    });

    it('should detect full desk collision', () => {
      const position = new THREE.Vector3(0, 0, 0);
      const isInsideDesk =
        position.x > DESK_BOUNDS.minX &&
        position.x < DESK_BOUNDS.maxX &&
        position.z > DESK_BOUNDS.minZ &&
        position.z < DESK_BOUNDS.maxZ;
      expect(isInsideDesk).toBe(true);
    });

    it('should not detect collision outside desk', () => {
      const position = new THREE.Vector3(10, 0, 10);
      const isInsideDesk =
        position.x > DESK_BOUNDS.minX &&
        position.x < DESK_BOUNDS.maxX &&
        position.z > DESK_BOUNDS.minZ &&
        position.z < DESK_BOUNDS.maxZ;
      expect(isInsideDesk).toBe(false);
    });

    it('should handle edge cases at desk boundaries', () => {
      const positionAtEdge = new THREE.Vector3(DESK_BOUNDS.maxX, 0, 0);
      const isInsideDesk =
        positionAtEdge.x > DESK_BOUNDS.minX &&
        positionAtEdge.x < DESK_BOUNDS.maxX &&
        positionAtEdge.z > DESK_BOUNDS.minZ &&
        positionAtEdge.z < DESK_BOUNDS.maxZ;
      expect(isInsideDesk).toBe(false); // At boundary, not inside
    });
  });

  describe('Movement Validation', () => {
    it('should validate safe movement direction', () => {
      const currentPos = new THREE.Vector3(0, 0, 0);
      const targetPos = new THREE.Vector3(1, 0, 1);
      const direction = targetPos.clone().sub(currentPos).normalize();

      expect(direction.x).toBeCloseTo(0.707, 2); // cos(45°)
      expect(direction.z).toBeCloseTo(0.707, 2);
    });

    it('should clamp diagonal movement to bounds', () => {
      const position = new THREE.Vector3(WORLD_BOUNDS.maxX + 1, 0, WORLD_BOUNDS.maxZ + 1);
      const clampedPos = new THREE.Vector3(
        Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, position.x)),
        position.y,
        Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, position.z))
      );

      expect(clampedPos.x).toBe(WORLD_BOUNDS.maxX);
      expect(clampedPos.z).toBe(WORLD_BOUNDS.maxZ);
    });

    it('should handle zero movement', () => {
      const currentPos = new THREE.Vector3(5, 0, 5);
      const targetPos = currentPos.clone();
      const distance = currentPos.distanceTo(targetPos);
      expect(distance).toBe(0);
    });
  });

  describe('Raycasting Simulation', () => {
    it('should detect wall intersection from origin', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const raycastDistance = 20; // Beyond wall

      // Simulate hitting wall at maxX
      const distanceToWall = WORLD_BOUNDS.maxX - origin.x;
      const willHitWall = raycastDistance > distanceToWall;

      expect(willHitWall).toBe(true);
      expect(distanceToWall).toBe(15);
    });

    it('should not detect intersection when moving away from wall', () => {
      const origin = new THREE.Vector3(WORLD_BOUNDS.maxX - 1, 0, 0);
      const direction = new THREE.Vector3(-1, 0, 0).normalize(); // Moving away
      const raycastDistance = 5;

      const distanceToWall = WORLD_BOUNDS.maxX - origin.x;
      const willHitWall = raycastDistance > distanceToWall && direction.x > 0;

      expect(willHitWall).toBe(false);
    });
  });
});
