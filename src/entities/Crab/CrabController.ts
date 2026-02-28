import { isWithinBounds } from '@core/Physics';
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
  private _crabBox = new Box3();
  public wallProximity: number = 0; // Facteur de proximité au mur (0-1)
  private _wallProximityCache = { position: new Vector3(), rotation: 0, value: 0 };
  private _testPoint = new Vector3();

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
   * Vérifie si la position intersecte un obstacle
   * Utilise une AABB (bounding box) autour du crabe pour une détection volumétrique
   * avec marge de sécurité pour éviter de coller aux obstacles
   */
  private collidesWithObstacle(position: Vector3): boolean {
    // Pré-alloue le Box3 pour le crabe
    const crabRadius = PHYSICS.COLLISION_RADIUS;
    const crabHeight = PHYSICS.CRAB_HEIGHT;
    const margin = PHYSICS.COLLISION_MARGIN;
    this._crabBox.min.set(
      position.x - crabRadius - margin,
      position.y,
      position.z - crabRadius - margin
    );
    this._crabBox.max.set(
      position.x + crabRadius + margin,
      position.y + crabHeight,
      position.z + crabRadius + margin
    );
    for (const box of this.obstacles) {
      if (this._crabBox.intersectsBox(box)) {
        return true;
      }
    }
    return false;
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
   * Update crab position and state based on keyboard input OR joystick input
   * Call this every frame (in useFrame)
   * @param keys - Keyboard state
   * @param deltaTime - Time since last frame
   * @param joystickDirection - Optional joystick direction (replaces keyboard on mobile)
   */
  update(keys: KeyboardState, deltaTime: number, joystickDirection?: Vector3 | null): CrabState {
    // Calculate movement direction based on input source
    const direction = new Vector3(0, 0, 0);

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

    // Calculate new position with axis-separated collision detection
    // This allows sliding along walls instead of getting stuck
    const newPosition = this.state.position.clone();
    const deltaX = this.state.velocity.x * deltaTime;
    const deltaZ = this.state.velocity.z * deltaTime;

    // Try moving on X axis only
    const testX = this.state.position.clone();
    testX.x += deltaX;
    const canMoveX =
      isWithinBounds(testX, {
        minX: SCENE_BOUNDS.MIN_X,
        maxX: SCENE_BOUNDS.MAX_X,
        minZ: SCENE_BOUNDS.MIN_Z,
        maxZ: SCENE_BOUNDS.MAX_Z,
      }) && !this.collidesWithObstacle(testX);

    // Try moving on Z axis only
    const testZ = this.state.position.clone();
    testZ.z += deltaZ;
    const canMoveZ =
      isWithinBounds(testZ, {
        minX: SCENE_BOUNDS.MIN_X,
        maxX: SCENE_BOUNDS.MAX_X,
        minZ: SCENE_BOUNDS.MIN_Z,
        maxZ: SCENE_BOUNDS.MAX_Z,
      }) && !this.collidesWithObstacle(testZ);

    // Try moving on both axes
    newPosition.x += deltaX;
    newPosition.z += deltaZ;
    const canMoveBoth =
      isWithinBounds(newPosition, {
        minX: SCENE_BOUNDS.MIN_X,
        maxX: SCENE_BOUNDS.MAX_X,
        minZ: SCENE_BOUNDS.MIN_Z,
        maxZ: SCENE_BOUNDS.MAX_Z,
      }) && !this.collidesWithObstacle(newPosition);

    // Apply movement based on collision results
    if (canMoveBoth) {
      // Can move freely in both directions
      this.state.position.copy(newPosition);
    } else if (canMoveX && !canMoveZ) {
      // Blocked on Z, but can slide on X
      this.state.position.copy(testX);
      this.state.velocity.z = 0; // Stop Z velocity to prevent accumulation
    } else if (canMoveZ && !canMoveX) {
      // Blocked on X, but can slide on Z
      this.state.position.copy(testZ);
      this.state.velocity.x = 0; // Stop X velocity to prevent accumulation
    } else {
      // Blocked on both axes - stop completely
      this.state.velocity.x = 0;
      this.state.velocity.z = 0;
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
   * Get current crab state (immutable copy)
   */
  getState(): CrabState {
    // Pour la perf, on pourrait retourner directement les références (attention aux effets de bord)
    // return { ...this.state };
    return {
      position: this.state.position.clone(),
      rotation: this.state.rotation.clone(),
      velocity: this.state.velocity.clone(),
      animationState: this.state.animationState,
    };
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
