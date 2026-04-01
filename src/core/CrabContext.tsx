import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import type { CrabContextType } from './crabContext';
import { CrabContext } from './crabContext';

interface CrabProviderProps {
  children: ReactNode;
  joystickMovement?: () => Vector3 | null;
}

/**
 * CrabProvider Component
 * Provides crab state to all child components via mutable refs.
 * Position is a shared Vector3 mutated in-place - consumers read it
 * inside useFrame without causing React re-renders.
 */
export function CrabProvider({ children, joystickMovement }: CrabProviderProps) {
  const positionRef = useRef(new Vector3(0, 0, 0));
  const rotationRef = useRef(0);
  const animationStateRef = useRef<'idle' | 'walking'>('idle');

  const updatePosition = useCallback((newPosition: Vector3) => {
    positionRef.current.copy(newPosition);
  }, []);

  const updateRotation = useCallback((newRotation: number) => {
    rotationRef.current = newRotation;
  }, []);

  const updateAnimationState = useCallback((state: 'idle' | 'walking') => {
    animationStateRef.current = state;
  }, []);

  // Stable context value - never triggers re-renders of consumers.
  // position is a mutable Vector3 ref read imperatively in useFrame.
  // rotation / animationState use getters to always return latest value.
  const value = useMemo<CrabContextType>(
    () => ({
      position: positionRef.current,
      get rotation() {
        return rotationRef.current;
      },
      get animationState() {
        return animationStateRef.current;
      },
      updatePosition,
      updateRotation,
      updateAnimationState,
      joystickMovement,
    }),
    [joystickMovement, updatePosition, updateRotation, updateAnimationState]
  );

  return <CrabContext.Provider value={value}>{children}</CrabContext.Provider>;
}
