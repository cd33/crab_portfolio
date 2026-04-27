import type { KeyboardState } from '@hooks/useKeyboard';
import { MOVEMENT, PHYSICS, SCENE_BOUNDS } from '@utils/constants';
import { Box3, Euler, Vector3 } from 'three';

interface CrabState {
  position: Vector3;
  rotation: Euler;
  velocity: Vector3;
  animationState: 'idle' | 'walk' | 'interact';
}

/**
 * CrabController - Handles crab movement, rotation, and collision detection
 * Updates crab state based on keyboard input
 */
export class CrabController {
  private state: CrabState;
  private obstacles: Box3[] = [];
  public wallProximity: number = 0; // Facteur de proximité au mur (0-1)
  private _wallProximityCache = { position: new Vector3(), rotation: 0, value: 0 };
  private _testPoint = new Vector3();
  // Pre-allocated vectors for update() - avoid GC pressure at 60fps
  private _direction = new Vector3();
  private _newPosition = new Vector3();
  private _testX = new Vector3();
  private _contactNormal = new Vector3();

  constructor(initialPosition: Vector3 = new Vector3(0, 0, 0)) {
    this.state = {
      position: initialPosition.clone(),
      rotation: new Euler(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      animationState: 'idle',
    };
  }

  /**
   * Définit les obstacles pour la détection de collision (AABB)
   */
  setObstacles(obstacles: Box3[]): void {
    this.obstacles = obstacles;
  }

  /**
   * Détecte la distance au mur devant le crabe (pour animation des pinces)
   * Retourne 0 si pas de mur proche, sinon un facteur entre 0 et 1
   */
  getWallProximity(): number {
    const position = this.state.position;
    const rotation = this.state.rotation.y;
    // Optimisation : cache le résultat si position/rotation inchangée
    const cache = this._wallProximityCache;
    if (cache.position.equals(position) && cache.rotation === rotation) {
      return cache.value;
    }
    const maxCheckDistance = 2;
    const stepSize = 0.2; // Moins de points à tester, ajuster si besoin
    const dirX = Math.sin(rotation);
    const dirZ = Math.cos(rotation);
    let minDistance = maxCheckDistance;
    let foundWall = false;
    for (const box of this.obstacles) {
      for (let step = 0.1; step <= maxCheckDistance; step += stepSize) {
        this._testPoint.set(position.x + dirX * step, position.y + 0.4, position.z + dirZ * step);
        if (box.containsPoint(this._testPoint)) {
          minDistance = step;
          foundWall = true;
          break;
        }
      }
      if (foundWall) break;
    }
    let proximity = 0;
    if (foundWall && minDistance < maxCheckDistance) {
      proximity = Math.max(0, Math.min(1, 1 - minDistance / maxCheckDistance));
    }
    cache.position.copy(position);
    cache.rotation = rotation;
    cache.value = proximity;
    return proximity;
  }

  /**
   * Swept sphere test against all obstacles in the XZ plane.
   * Expands each obstacle AABB by crab radius + margin (Minkowski sum) so the
   * crab centre can be treated as a point ray.
   *
   * Returns the earliest collision fraction t ∈ [0, 1]:
   *   • t = 1  → no collision, full movement is safe
   *   • t < 1  → collision at that fraction; also writes the contact surface
   *              normal into this._contactNormal for sliding resolution
   */
  private sweepSphereAABB(from: Vector3, deltaX: number, deltaZ: number): number {
    const r = PHYSICS.COLLISION_RADIUS + PHYSICS.COLLISION_MARGIN;
    let tMin = 1.0;
    this._contactNormal.set(0, 0, 0);

    for (const box of this.obstacles) {
      // Minkowski-expand the obstacle by the sphere radius
      const exMinX = box.min.x - r;
      const exMaxX = box.max.x + r;
      const exMinZ = box.min.z - r;
      const exMaxZ = box.max.z + r;

      // Skip if crab Y range does not overlap the box Y range
      if (from.y + PHYSICS.CRAB_HEIGHT < box.min.y || from.y > box.max.y) continue;

      let tEnter = 0.0;
      let tExit = 1.0;
      let nX = 0;
      let nZ = 0;

      // --- X slab ---
      if (Math.abs(deltaX) > 1e-10) {
        const inv = 1.0 / deltaX;
        let t1 = (exMinX - from.x) * inv;
        let t2 = (exMaxX - from.x) * inv;
        let nx = -1; // approaching from min-X side
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
          nx = 1; // approaching from max-X side
        }
        if (t1 > tEnter) {
          tEnter = t1;
          nX = nx;
          nZ = 0;
        }
        tExit = Math.min(tExit, t2);
      } else if (from.x < exMinX || from.x > exMaxX) {
        continue; // No X movement and outside X slab → no possible collision
      }

      // --- Z slab ---
      if (Math.abs(deltaZ) > 1e-10) {
        const inv = 1.0 / deltaZ;
        let t1 = (exMinZ - from.z) * inv;
        let t2 = (exMaxZ - from.z) * inv;
        let nz = -1; // approaching from min-Z side
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
          nz = 1; // approaching from max-Z side
        }
        if (t1 > tEnter) {
          tEnter = t1;
          nX = 0;
          nZ = nz;
        }
        tExit = Math.min(tExit, t2);
      } else if (from.z < exMinZ || from.z > exMaxZ) {
        continue; // No Z movement and outside Z slab → no possible collision
      }

      // Valid hit: slabs overlap and the entry point is within [0, 1]
      if (tEnter >= 0.0 && tEnter <= tExit && tEnter < tMin) {
        tMin = tEnter;
        this._contactNormal.set(nX, 0, nZ);
      }
    }

    return tMin;
  }

  /**
   * Update crab position and state based on keyboard input OR joystick input
   * Call this every frame (in useFrame)
   * @param keys - Keyboard state
   * @param deltaTime - Time since last frame
   * @param joystickDirection - Optional joystick direction (replaces keyboard on mobile)
   */
  update(keys: KeyboardState, deltaTime: number, joystickDirection?: Vector3 | null): CrabState {
    // Calculate movement direction based on input source
    const direction = this._direction.set(0, 0, 0);

    // Prioritize joystick input if available (mobile touch controls)
    if (joystickDirection) {
      direction.copy(joystickDirection);
    } else {
      // Fallback to keyboard input (desktop)
      if (keys.forward) direction.z -= 1;
      if (keys.backward) direction.z += 1;
      if (keys.left) direction.x -= 1;
      if (keys.right) direction.x += 1;
    }

    // Normalize direction to prevent faster diagonal movement
    if (direction.length() > 0) {
      direction.normalize();
    }

    // Update velocity
    if (direction.length() > 0) {
      this.state.velocity.x = direction.x * MOVEMENT.SPEED;
      this.state.velocity.z = direction.z * MOVEMENT.SPEED;
      this.state.animationState = 'walk';
    } else {
      // Apply damping when no input
      this.state.velocity.multiplyScalar(MOVEMENT.DAMPING);

      if (this.state.velocity.length() < MOVEMENT.MIN_VELOCITY) {
        this.state.velocity.set(0, 0, 0);
        this.state.animationState = 'idle';
      }
    }

    // --- Swept sphere collision resolution (Minkowski + slab ray test) ---
    // Handles diagonal slides correctly: the crab glides along the contact
    // surface instead of stopping at corners.
    const deltaX = this.state.velocity.x * deltaTime;
    const deltaZ = this.state.velocity.z * deltaTime;
    const SWEEP_EPS = 1e-3;

    // Phase 1 - find the earliest collision along the full diagonal movement
    const t = this.sweepSphereAABB(this.state.position, deltaX, deltaZ);
    const safeT = Math.max(0.0, t - SWEEP_EPS);

    // Move to the safe fraction of the intended path
    this._newPosition.set(
      this.state.position.x + deltaX * safeT,
      this.state.position.y,
      this.state.position.z + deltaZ * safeT
    );
    // Scene-boundary clamp (wall Box3s in obstacles handle most cases)
    this._newPosition.x = Math.max(
      SCENE_BOUNDS.MIN_X,
      Math.min(SCENE_BOUNDS.MAX_X, this._newPosition.x)
    );
    this._newPosition.z = Math.max(
      SCENE_BOUNDS.MIN_Z,
      Math.min(SCENE_BOUNDS.MAX_Z, this._newPosition.z)
    );
    this.state.position.copy(this._newPosition);

    // Phase 2 - if a collision occurred, slide along the contact surface
    if (t < 1.0 - SWEEP_EPS && this._contactNormal.lengthSq() > 0) {
      // Remove velocity component along contact normal → project onto slide plane
      const normalDot =
        this.state.velocity.x * this._contactNormal.x +
        this.state.velocity.z * this._contactNormal.z;
      this.state.velocity.x -= normalDot * this._contactNormal.x;
      this.state.velocity.z -= normalDot * this._contactNormal.z;

      // Apply remaining slide within the same frame
      const remainFraction = 1.0 - safeT;
      const slideDX = this.state.velocity.x * deltaTime * remainFraction;
      const slideDZ = this.state.velocity.z * deltaTime * remainFraction;

      if (slideDX * slideDX + slideDZ * slideDZ > SWEEP_EPS * SWEEP_EPS) {
        const slideT = this.sweepSphereAABB(this.state.position, slideDX, slideDZ);
        const slideSafeT = Math.max(0.0, slideT - SWEEP_EPS);
        this._testX.set(
          this.state.position.x + slideDX * slideSafeT,
          this.state.position.y,
          this.state.position.z + slideDZ * slideSafeT
        );
        this._testX.x = Math.max(SCENE_BOUNDS.MIN_X, Math.min(SCENE_BOUNDS.MAX_X, this._testX.x));
        this._testX.z = Math.max(SCENE_BOUNDS.MIN_Z, Math.min(SCENE_BOUNDS.MAX_Z, this._testX.z));
        this.state.position.copy(this._testX);
      }
    }

    // Update rotation to face input direction (not velocity)
    // This allows rotation even when blocked by obstacles
    if (direction.length() > 0.1) {
      const angle = Math.atan2(direction.x, direction.z);
      this.state.rotation.y = angle;
    }

    // Keep Y position at ground level
    this.state.position.y = PHYSICS.GROUND_Y;

    // Update wall proximity for claw animations
    this.wallProximity = this.getWallProximity();

    return this.getState();
  }

  /**
   * Get current crab state (direct references - do not mutate externally)
   */
  getState(): CrabState {
    return this.state;
  }

  /**
   * Reset crab to initial position
   */
  reset(position: Vector3 = new Vector3(0, 0, 0)): void {
    this.state.position.copy(position);
    this.state.velocity.set(0, 0, 0);
    this.state.rotation.set(0, 0, 0);
    this.state.animationState = 'idle';
  }
}
