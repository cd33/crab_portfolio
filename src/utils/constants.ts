/**
 * Global Constants for Crab Portfolio
 * Centralized configuration values for consistent behavior across the application
 */

const isMobile =
  typeof navigator !== 'undefined' &&
  (navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

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
  DISTANCE: isMobile ? 12 : 10,

  /** Camera height above ground */
  HEIGHT: isMobile ? 8 : 7,

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

export const PASSWORD_HASHES = [
  '5b34d927b251c12992dca0ccf2a41ba97d1618730f0421dd2268784f29d5ce0c',
  'f51b3fe579785acdf5e830d257619c2e06af735275b690ac00e813a167ec4fc2',
  '797fba4e523f39e28bc4469ad6353509bd6dec30fa1c93ab5e02444ea4d38da1',
  '6b0ceb02aaa765e0f36bf10a4315d4365ebf12e57f2804daadb3338d048bc7d9',
  '31ff564ed20c422f96bc35b3f60b4a86c7ddebff58dcb7d1b6f4355e98419c8e',
] as const;
export const PASSWORDS_COUNT = PASSWORD_HASHES.length;

/**
 * Hashes a string with SHA-256 using the Web Crypto API.
 * Returns a hex-encoded digest.
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a user-supplied password against a stored SHA-256 hash.
 */
export async function verifyPassword(input: string, hash: string): Promise<boolean> {
  const inputHash = await sha256(input);
  return inputHash === hash;
}
