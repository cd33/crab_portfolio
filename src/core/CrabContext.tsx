import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { Vector3 } from 'three';
import { CrabContext } from './crabContext';

interface CrabProviderProps {
  children: ReactNode;
  joystickMovement?: () => Vector3 | null;
}

/**
 * CrabProvider Component
 * Provides crab state to all child components
 */
export function CrabProvider({ children, joystickMovement }: CrabProviderProps) {
  const [position, setPosition] = useState(new Vector3(0, 0, 0));
  const [rotation, setRotation] = useState(0);
  const [animationState, setAnimationState] = useState<'idle' | 'walking'>('idle');

  const updatePosition = useCallback((newPosition: Vector3) => {
    setPosition(newPosition.clone());
  }, []);

  const updateRotation = useCallback((newRotation: number) => {
    setRotation(newRotation);
  }, []);

  const updateAnimationState = useCallback((state: 'idle' | 'walking') => {
    setAnimationState(state);
  }, []);

  return (
    <CrabContext.Provider
      value={{
        position,
        rotation,
        animationState,
        updatePosition,
        updateRotation,
        updateAnimationState,
        joystickMovement,
      }}
    >
      {children}
    </CrabContext.Provider>
  );
}
