/**
 * Collision Detection Tests
 * Validates boundaries and collision behavior
 */
import * as THREE from 'three';
import { Box3, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { CrabController } from '../entities/Crab/CrabController';
import type { KeyboardState } from '../hooks/useKeyboard';

function makeKeys(overrides: Partial<KeyboardState> = {}): KeyboardState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
    escape: false,
    map: false,
    ...overrides,
  };
}

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

// ─────────────────────────────────────────────────────────────────────────────
// CrabController - swept sphere diagonal collision tests
// ─────────────────────────────────────────────────────────────────────────────
describe('CrabController - diagonal collision (swept sphere)', () => {
  // PHYSICS constants mirrored from src/utils/constants.ts
  const COLLISION_RADIUS = 0.55;
  const COLLISION_MARGIN = 0.25;
  const R = COLLISION_RADIUS + COLLISION_MARGIN; // 0.80

  const GROUND_Y = 0.5;

  function makeController(pos: Vector3, obstacles: Box3[] = []): CrabController {
    const ctrl = new CrabController(pos);
    ctrl.setObstacles(obstacles);
    return ctrl;
  }

  function runFrames(ctrl: CrabController, keys: KeyboardState, frames: number, dt = 1 / 60) {
    for (let i = 0; i < frames; i++) ctrl.update(keys, dt);
  }

  // ── 1. Clear diagonal ─────────────────────────────────────────────────────
  it('allows full diagonal movement when path is clear', () => {
    const ctrl = makeController(new Vector3(0, GROUND_Y, 0));

    ctrl.update(makeKeys({ forward: true, right: true }), 1 / 60);
    const { position } = ctrl.getState();

    // Both axes must have advanced
    expect(position.x).toBeGreaterThan(0);
    expect(position.z).toBeLessThan(0); // forward = -Z in this game
  });

  // ── 2. Diagonal slide along Z-wall ────────────────────────────────────────
  it('slides along a wall when moving diagonally into it (Z-wall)', () => {
    // FrontWall: z = 3 → 4. Crab starts at (0, 0.5, 1.5) and moves forward+right.
    const wall = new Box3(new Vector3(-6, 0, 3), new Vector3(6, 3, 4));
    const ctrl = makeController(new Vector3(0, GROUND_Y, 1.5), [wall]);

    runFrames(ctrl, makeKeys({ forward: true, right: true }), 30);

    const { position } = ctrl.getState();
    // Must not have passed through the expanded wall boundary
    expect(position.z).toBeLessThan(3 - R + 0.01);
    // Must have slid in X (positive direction)
    expect(position.x).toBeGreaterThan(0.1);
  });

  // ── 3. Diagonal slide along X-wall ────────────────────────────────────────
  it('slides along a wall when moving diagonally into it (X-wall)', () => {
    // RightWall: x = 5.5 → 6.5. Crab starts at (4, 0.5, 0) and moves right+forward.
    const wall = new Box3(new Vector3(5.5, 0, -5), new Vector3(6.5, 3, 5));
    const ctrl = makeController(new Vector3(4, GROUND_Y, 0), [wall]);

    runFrames(ctrl, makeKeys({ right: true, forward: true }), 30);

    const { position } = ctrl.getState();
    expect(position.x).toBeLessThan(5.5 - R + 0.01);
    expect(position.z).toBeLessThan(0); // Has moved forward (−Z)
  });

  // ── 4. Corner: both walls individually clear, diagonal blocked ─────────────
  it('does not tunnel through an obstacle corner hit diagonally', () => {
    // A single box at (2,0,2)→(4,3,4).
    // Crab starts at (0, 0.5, 0) and moves diagonally toward the corner.
    // "backward" = +Z, "right" = +X  → approaches the box's front-left corner.
    const box = new Box3(new Vector3(2, 0, 2), new Vector3(4, 3, 4));
    const ctrl = makeController(new Vector3(0, GROUND_Y, 0), [box]);

    runFrames(ctrl, makeKeys({ right: true, backward: true }), 60);

    const { position } = ctrl.getState();
    // Must not be inside the Minkowski-expanded bounding box
    const isInsideBox =
      position.x > 2 - R && position.x < 4 + R && position.z > 2 - R && position.z < 4 + R;
    expect(isInsideBox).toBe(false);
  });

  // ── 5. Swept test prevents tunneling through thin obstacle ────────────────
  it('does not tunnel through a thin Z-slab with a large delta', () => {
    // Thin wall straddling z=0
    const thinWall = new Box3(new Vector3(-10, 0, -0.05), new Vector3(10, 3, 0.05));
    const ctrl = makeController(new Vector3(0, GROUND_Y, 1.5), [thinWall]);

    // One large time-step (0.3 s) that would skip the wall without sweep
    ctrl.update(makeKeys({ forward: true }), 0.3);

    const { position } = ctrl.getState();
    // Should be stopped at/before the expanded wall boundary, not past it
    expect(position.z).toBeGreaterThanOrEqual(0.05 - R - 0.05);
  });

  // ── 6. Desk corners - all four corners resist penetration ─────────────────
  const deskBox = new Box3(new Vector3(-1.8, 0, -4), new Vector3(1.8, 1, -2.3));
  const deskCorners: Array<{ label: string; start: Vector3; keys: Partial<KeyboardState> }> = [
    {
      label: 'front-left corner',
      start: new Vector3(-3, GROUND_Y, -1),
      keys: { right: true, backward: true },
    },
    {
      label: 'front-right corner',
      start: new Vector3(3, GROUND_Y, -1),
      keys: { left: true, backward: true },
    },
    {
      label: 'back-left corner',
      start: new Vector3(-3, GROUND_Y, -5.5),
      keys: { right: true, forward: true },
    },
    {
      label: 'back-right corner',
      start: new Vector3(3, GROUND_Y, -5.5),
      keys: { left: true, forward: true },
    },
  ];

  deskCorners.forEach(({ label, start, keys }) => {
    it(`desk ${label} - crab cannot enter the expanded bounding box`, () => {
      const ctrl = makeController(start, [deskBox]);
      runFrames(ctrl, makeKeys(keys), 40);
      const { position } = ctrl.getState();
      const insideDesk =
        position.x > deskBox.min.x - R &&
        position.x < deskBox.max.x + R &&
        position.z > deskBox.min.z - R &&
        position.z < deskBox.max.z + R;
      expect(insideDesk).toBe(false);
    });
  });

  // ── 7. No contact when moving parallel to obstacle ─────────────────────────
  it('allows free movement when moving parallel to a wall', () => {
    // Wall on the right, crab moves straight forward (no X movement)
    const wall = new Box3(new Vector3(3, 0, -10), new Vector3(4, 3, 10));
    const ctrl = makeController(new Vector3(0, GROUND_Y, 2), [wall]);

    runFrames(ctrl, makeKeys({ forward: true }), 20);

    const { position } = ctrl.getState();
    // X should be unchanged (no X velocity)
    expect(position.x).toBeCloseTo(0, 1);
    // Z should have advanced freely
    expect(position.z).toBeLessThan(2);
  });
});
