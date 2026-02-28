import { createContext } from 'react';
import { Vector3 } from 'three';

/**
 * Crab Context Type
 * Shares crab position and state across components
 */
export interface CrabContextType {
  position: Vector3;
  rotation: number;
  animationState: 'idle' | 'walking';
  updatePosition: (position: Vector3) => void;
  updateRotation: (rotation: number) => void;
  updateAnimationState: (state: 'idle' | 'walking') => void;
  joystickMovement?: () => Vector3 | null;
}

/**
 * Crab Context
 * Used to share crab state between Camera, UI, and other components
 */
export const CrabContext = createContext<CrabContextType | null>(null);
