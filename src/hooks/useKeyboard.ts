import { useStore } from '@/store/useStore';
import { KEYS_AZERTY, KEYS_QWERTY } from '@utils/constants';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface KeyboardState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
  escape: boolean;
  map: boolean;
}

/**
 * Custom hook for keyboard input handling
 * Tracks WASD/Arrow keys for movement and action keys
 */
export function useKeyboard() {
  const { isTerminalOpen, isPanelOpen, isCVModalOpen, isSettingsOpen, keyboardLayout } = useStore();

  // Select the correct key mapping based on keyboard layout
  const KEYS = useMemo(
    () => (keyboardLayout === 'azerty' ? KEYS_AZERTY : KEYS_QWERTY),
    [keyboardLayout]
  );

  const [keys, setKeys] = useState<KeyboardState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
    escape: false,
    map: false,
  });

  // Réinitialise les touches quand la fenêtre perd le focus (changement d'onglet)
  useEffect(() => {
    const handleBlur = () => {
      setKeys({
        forward: false,
        backward: false,
        left: false,
        right: false,
        interact: false,
        escape: false,
        map: false,
      });
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle game controls when terminal is open
      if (isTerminalOpen) return;

      const key = event.key;

      setKeys((prev) => {
        const newState = { ...prev };

        if ((KEYS.FORWARD as readonly string[]).includes(key)) newState.forward = true;
        if ((KEYS.BACKWARD as readonly string[]).includes(key)) newState.backward = true;
        if ((KEYS.LEFT as readonly string[]).includes(key)) newState.left = true;
        if ((KEYS.RIGHT as readonly string[]).includes(key)) newState.right = true;
        if ((KEYS.INTERACT as readonly string[]).includes(key)) newState.interact = true;
        if ((KEYS.ESCAPE as readonly string[]).includes(key)) newState.escape = true;
        if ((KEYS.MAP as readonly string[]).includes(key)) newState.map = true;

        return newState;
      });
    },
    [isTerminalOpen, KEYS]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle game controls when terminal is open
      if (isTerminalOpen) return;

      const key = event.key;

      setKeys((prev) => {
        const newState = { ...prev };

        if ((KEYS.FORWARD as readonly string[]).includes(key)) newState.forward = false;
        if ((KEYS.BACKWARD as readonly string[]).includes(key)) newState.backward = false;
        if ((KEYS.LEFT as readonly string[]).includes(key)) newState.left = false;
        if ((KEYS.RIGHT as readonly string[]).includes(key)) newState.right = false;
        if ((KEYS.INTERACT as readonly string[]).includes(key)) newState.interact = false;
        if ((KEYS.ESCAPE as readonly string[]).includes(key)) newState.escape = false;
        if ((KEYS.MAP as readonly string[]).includes(key)) newState.map = false;

        return newState;
      });
    },
    [isTerminalOpen, KEYS]
  );

  // Réinitialise les touches quand un panneau modal s'ouvre
  useEffect(() => {
    if (isTerminalOpen || isPanelOpen || isCVModalOpen || isSettingsOpen) {
      // Use a microtask to avoid cascading renders
      Promise.resolve().then(() => {
        setKeys({
          forward: false,
          backward: false,
          left: false,
          right: false,
          interact: false,
          escape: false,
          map: false,
        });
      });
    }
  }, [isTerminalOpen, isPanelOpen, isCVModalOpen, isSettingsOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return keys;
}
