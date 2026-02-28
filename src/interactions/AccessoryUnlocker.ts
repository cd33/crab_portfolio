import { useStore } from '@/store/useStore';
import { INTERACTIVES_OBJECTS } from '@/utils/constants';
import type { AccessoryType } from '@entities/Crab/Accessory';
import { useEffect } from 'react';

/**
 * Unlock Conditions for Accessories
 */
export const UNLOCK_CONDITIONS = {
  'hat-pokemon': {
    type: 'discover-all' as const,
    description: 'accessories.hatPokemon',
    check: (store: ReturnType<typeof useStore.getState>): boolean => {
      const totalObjects = INTERACTIVES_OBJECTS.length;
      return store.discoveredObjects.size >= totalObjects;
    },
  },
  'hat-crisis': {
    type: 'crisis' as const,
    description: 'accessories.hatCrisis',
  },
} as {
  [key in Exclude<AccessoryType, null>]: {
    type: 'discover-all' | 'crisis';
    description: string;
    check?: (store: ReturnType<typeof useStore.getState>) => boolean;
  };
};

/**
 * Hook to check and unlock accessories based on conditions
 * Call this in App.tsx or a top-level component
 */
export function useAccessoryUnlocker() {
  const store = useStore();

  useEffect(() => {
    // Check all unlock conditions periodically
    const checkUnlocks = () => {
      const state = useStore.getState();

      // Check each accessory
      Object.entries(UNLOCK_CONDITIONS).forEach(([accessory, condition]) => {
        const accessoryType = accessory as AccessoryType;

        // Skip if already unlocked
        if (state.isAccessoryUnlocked(accessoryType)) return;

        // Check condition
        if (condition.check && condition.check(state)) {
          state.unlockAccessory(accessoryType);
        }
      });
    };

    // Check immediately
    checkUnlocks();

    // Check every 5 seconds
    const interval = setInterval(checkUnlocks, 5000);

    return () => clearInterval(interval);
  }, [store.discoveredObjects.size]);
}

/**
 * Get progress towards unlocking an accessory
 */
export function getUnlockProgress(accessory: AccessoryType): {
  current: number;
  required: number;
  percentage: number;
  description: string;
} {
  if (!accessory) {
    return { current: 0, required: 0, percentage: 0, description: '' };
  }

  const condition = UNLOCK_CONDITIONS[accessory];
  const state = useStore.getState();

  switch (condition.type) {
    case 'discover-all': {
      const totalObjects = INTERACTIVES_OBJECTS.length;
      const discovered = state.discoveredObjects.size;
      return {
        current: discovered,
        required: totalObjects,
        percentage: (discovered / totalObjects) * 100,
        description: condition.description,
      };
    }
    case 'crisis': {
      const isUnlocked = state.isAccessoryUnlocked(accessory);
      return {
        current: isUnlocked ? 1 : 0,
        required: 1,
        percentage: isUnlocked ? 100 : 0,
        description: condition.description,
      };
    }

    default:
      return { current: 0, required: 0, percentage: 0, description: '' };
  }
}
