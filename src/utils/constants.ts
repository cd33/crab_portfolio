/**
 * Global Constants for Crab Portfolio
 * Centralized configuration values for consistent behavior across the application
 */

// ============================================
// MOVEMENT & PHYSICS
// ============================================

export const MOVEMENT = {
  /** Crab walking speed (units/second) */
  SPEED: 3,

  /** Rotation speed when turning (radians/second) */
  ROTATION_SPEED: Math.PI * 2,

  /** Deceleration factor when stopping (0-1) */
  DAMPING: 0.85,

  /** Minimum velocity threshold before considering stopped */
  MIN_VELOCITY: 0.01,
} as const;

export const PHYSICS = {
  /** Rayon de collision horizontal du crabe (largeur/2) - inclut les pinces */
  COLLISION_RADIUS: 0.55,

  /** Hauteur du crabe pour détection de collision verticale */
  CRAB_HEIGHT: 0.8,

  /** Marge de sécurité autour du crabe pour éviter de coller aux obstacles */
  COLLISION_MARGIN: 0.25,

  /** Raycasting distance for obstacle detection */
  RAY_DISTANCE: 1.0,

  /** Ground height (Y position for crab) - élevé pour éviter que les pattes traversent le bureau */
  GROUND_Y: 0.5,
} as const;

// ============================================
// SCENE BOUNDARIES
// ============================================

export const SCENE_BOUNDS = {
  /** Scene width (X axis) */
  WIDTH: 20,

  /** Scene depth (Z axis) */
  DEPTH: 15,

  /** Minimum X coordinate */
  MIN_X: -10,

  /** Maximum X coordinate */
  MAX_X: 10,

  /** Minimum Z coordinate */
  MIN_Z: -7.5,

  /** Maximum Z coordinate */
  MAX_Z: 7.5,
} as const;

// ============================================
// CAMERA
// ============================================

export const CAMERA = {
  /** Camera follow distance behind crab */
  DISTANCE: 8,

  /** Camera height above ground */
  HEIGHT: 6,

  /** Camera look-at height offset */
  LOOK_AT_HEIGHT: 1,

  /** Camera damping factor (0-1) */
  DAMPING: 0.05,

  /** Field of view (degrees) */
  FOV: 50,

  /** Near clipping plane */
  NEAR: 0.1,

  /** Far clipping plane */
  FAR: 100,
} as const;

// ============================================
// KEYBOARD CONTROLS
// ============================================

export const KEYS_QWERTY = {
  FORWARD: ['w', 'W', 'ArrowUp'],
  BACKWARD: ['s', 'S', 'ArrowDown'],
  LEFT: ['a', 'A', 'ArrowLeft'],
  RIGHT: ['d', 'D', 'ArrowRight'],
  INTERACT: ['e', 'E', ' '], // E or Space
  ESCAPE: ['Escape'],
  MAP: ['m', 'M'],
} as const;

export const KEYS_AZERTY = {
  FORWARD: ['z', 'Z', 'ArrowUp'],
  BACKWARD: ['s', 'S', 'ArrowDown'],
  LEFT: ['q', 'Q', 'ArrowLeft'],
  RIGHT: ['d', 'D', 'ArrowRight'],
  INTERACT: ['e', 'E', ' '], // E or Space
  ESCAPE: ['Escape'],
  MAP: ['m', 'M'],
} as const;

export const INTERACTIVES_OBJECTS = [
  { id: 'computer', nameKey: 'progress.objects.computer', icon: '💻' },
  { id: 'poster_1', nameKey: 'progress.objects.poster_1', icon: '🖼️' },
  { id: 'poster_2', nameKey: 'progress.objects.poster_2', icon: '🖼️' },
  { id: 'cv_sheet', nameKey: 'progress.objects.cv', icon: '📚' },
  { id: 'mug', nameKey: 'progress.objects.mug', icon: '☕' },
  { id: 'lamp', nameKey: 'progress.objects.lamp', icon: '💡' },
  { id: 'keypad', nameKey: 'progress.objects.keypad', icon: '🔢' },
  { id: 'switch', nameKey: 'progress.objects.switch', icon: '🔀' },
  // { id: 'plant-1', name: 'Plante', icon: '🌿', type: 'about' },
];

export const PASSWORDS = [
  'cr4b_m4st3r_2025',
  'm4st3rp13c3',
  'k33p_sm1l1ng',
  'k0n4m1_c0d3',
  '50_m374',
];
