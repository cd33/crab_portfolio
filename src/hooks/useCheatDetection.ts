import { useStore } from '@/store/useStore';
import { INTERACTIVES_OBJECTS } from '@/utils/constants';
import { useEffect, useRef } from 'react';

/**
 * Hook de détection de triche côté front
 * Surveille les manipulations suspectes du store et du jeu
 */
export function useCheatDetection(onCheatDetected: () => void) {
  const { unlockedAccessories, discoveredObjects, isDoorUnlocked, doorCount } = useStore();

  const detectionTimerRef = useRef<number>();
  const storeSnapshotRef = useRef<{
    unlockedCount: number;
    discoveredCount: number;
    doorUnlocked: boolean;
  } | null>(null);

  useEffect(() => {
    let isCheatDetected = false;

    // 1. Détection de modification du store via console
    const checkStoreManipulation = () => {
      // Vérifier les accessoires débloqués
      const currentAccessories = unlockedAccessories;
      const totalObjects = INTERACTIVES_OBJECTS.length;

      // Si tous les accessoires sont débloqués mais pas tous les objets découverts
      if (currentAccessories.size > 0 && discoveredObjects.size < totalObjects) {
        // Vérifier si un accessoire a été débloqué sans condition
        const hasHatPokemon = currentAccessories.has('hat-pokemon');
        if (hasHatPokemon && discoveredObjects.size < totalObjects) {
          console.warn('🚨 Triche détectée : Accessoire débloqué sans condition remplie');
          return true;
        }
      }

      // Vérifier si la porte est débloquée sans progression
      if (isDoorUnlocked && doorCount < 3) {
        console.warn('🚨 Triche détectée : Porte débloquée sans progression');
        return true;
      }

      // Vérifier les objets découverts anormaux
      if (discoveredObjects.size > totalObjects) {
        console.warn("🚨 Triche détectée : Nombre d'objets découverts impossible");
        return true;
      }

      return false;
    };

    // 2. Détection de changements suspects dans le store
    const checkStoreIntegrity = () => {
      // Sauvegarder l'état actuel
      if (!storeSnapshotRef.current) {
        storeSnapshotRef.current = {
          unlockedCount: unlockedAccessories.size,
          discoveredCount: discoveredObjects.size,
          doorUnlocked: isDoorUnlocked,
        };
        return false;
      }

      const snapshot = storeSnapshotRef.current;

      // Détecter les changements suspects (ajout massif d'objets)
      const accessoryDiff = unlockedAccessories.size - snapshot.unlockedCount;
      const discoveredDiff = discoveredObjects.size - snapshot.discoveredCount;

      // Si plus de 2 accessoires débloqués ou 5 objets découverts en moins de 100ms
      if (accessoryDiff > 2 || discoveredDiff > 5) {
        console.warn('🚨 Triche détectée : Changements suspects trop rapides');
        return true;
      }

      // Mettre à jour le snapshot
      storeSnapshotRef.current = {
        unlockedCount: unlockedAccessories.size,
        discoveredCount: discoveredObjects.size,
        doorUnlocked: isDoorUnlocked,
      };

      return false;
    };

    // // 3. Détection de tentative de modification du localStorage
    // const originalSetItem = Storage.prototype.setItem;
    // const suspiciousKeys = ['crab-portfolio', 'zustand'];

    // Storage.prototype.setItem = function (key: string, value: string) {
    //   // Intercepter les tentatives de modification suspectes
    //   if (suspiciousKeys.some((k) => key.includes(k))) {
    //     try {
    //       const parsed = JSON.parse(value);
    //       const state = parsed?.state;

    //       // Vérifier si on essaie d'injecter des accessoires
    //       if (state?.unlockedAccessories) {
    //         console.warn('🚨 Tentative de modification du localStorage détectée');
    //         isCheatDetected = true;
    //       }
    //     } catch {
    //       // Pas JSON, ignorer
    //     }
    //   }

    //   return originalSetItem.apply(this, [key, value]);
    // };

    // 4. Protection contre la manipulation de window.useStore
    if (typeof window !== 'undefined') {
      // Vérifier si la propriété n'est pas déjà définie
      if (!Object.getOwnPropertyDescriptor(window, 'useStore')) {
        try {
          Object.defineProperty(window, 'useStore', {
            get: () => useStore,
            set: () => {
              console.warn('🚨 Triche détectée : Tentative de remplacement du store');
              isCheatDetected = true;
            },
            configurable: false,
          });
        } catch (error) {
          // Si on ne peut pas définir la propriété, ignorer silencieusement
          console.warn('Protection du store non disponible:', error);
        }
      }
    }

    // Vérification périodique
    const interval = setInterval(() => {
      if (isCheatDetected) {
        clearInterval(interval);
        onCheatDetected();
        return;
      }

      if (checkStoreManipulation() || checkStoreIntegrity()) {
        isCheatDetected = true;
        clearInterval(interval);
        onCheatDetected();
      }
    }, 1000); // Vérifier toutes les 1000ms

    detectionTimerRef.current = interval as unknown as number;

    return () => {
      clearInterval(interval);
      // // Restaurer le localStorage original
      // Storage.prototype.setItem = originalSetItem;
    };
  }, [discoveredObjects.size, doorCount, isDoorUnlocked, onCheatDetected, unlockedAccessories]);

  // Vérification supplémentaire à chaque changement de store
  useEffect(() => {
    const totalObjects = INTERACTIVES_OBJECTS.length;

    // Vérifier l'intégrité après chaque changement
    if (unlockedAccessories.has('hat-pokemon') && discoveredObjects.size < totalObjects) {
      console.warn('🚨 Incohérence détectée dans le store');
      onCheatDetected();
    }
  }, [
    unlockedAccessories.size,
    discoveredObjects.size,
    isDoorUnlocked,
    onCheatDetected,
    unlockedAccessories,
  ]);
}
