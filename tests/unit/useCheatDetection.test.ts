import { useCheatDetection } from '@/hooks/useCheatDetection';
import { useStore } from '@/store/useStore';
import { INTERACTIVES_OBJECTS } from '@/utils/constants';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Reset state before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useCheatDetection', () => {
  it("n'appelle pas le callback pour un jeu normal (aucune triche)", () => {
    const onCheat = vi.fn();
    renderHook(() => useCheatDetection(onCheat));

    vi.advanceTimersByTime(3000);

    expect(onCheat).not.toHaveBeenCalled();
  });

  it('appelle le callback si hat-pokemon est débloqué sans tous les objets découverts', () => {
    const onCheat = vi.fn();

    // Simuler la triche : débloquer hat-pokemon sans avoir découvert tous les objets
    useStore.getState().unlockAccessory('hat-pokemon');
    // discoveredObjects.size < INTERACTIVES_OBJECTS.length → triche

    renderHook(() => useCheatDetection(onCheat));

    // L'effet secondaire (useEffect sur le changement de store) devrait déclencher
    expect(onCheat).toHaveBeenCalled();
  });

  it("n'appelle pas le callback si hat-pokemon est débloqué avec tous les objets découverts", () => {
    const onCheat = vi.fn();

    // Découvrir tous les objets légitimement
    INTERACTIVES_OBJECTS.forEach((obj) => useStore.getState().discoverObject(obj.id));
    // Maintenant débloquer l'accessoire légitimement
    useStore.getState().unlockAccessory('hat-pokemon');

    renderHook(() => useCheatDetection(onCheat));

    vi.advanceTimersByTime(2000);

    expect(onCheat).not.toHaveBeenCalled();
  });

  it('détecte des accessoires débloqués impossibles (> TOTAL_OBJECTS accessoires)', () => {
    const onCheat = vi.fn();

    // Simuler un état incohérent : plus d'objets découverts que possible
    // En manipulant directement le store (ce qu'un tricheur ferait)
    const tooMany = INTERACTIVES_OBJECTS.length + 1;
    useStore.setState(() => ({
      discoveredObjects: new Set(Array.from({ length: tooMany }, (_, i) => `fake-obj-${i}`)),
    }));

    renderHook(() => useCheatDetection(onCheat));

    vi.advanceTimersByTime(1100);

    // discoveredObjects.size > INTERACTIVES_OBJECTS.length → détecté
    expect(onCheat).toHaveBeenCalled();
  });

  it('ne déclenche pas pour des ajouts progressifs normaux', () => {
    const onCheat = vi.fn();

    renderHook(() => useCheatDetection(onCheat));

    // Avancer un premier cycle pour créer le snapshot
    vi.advanceTimersByTime(1100);

    // Ajouter 2 objets (< seuil de 5) → normal
    useStore.getState().discoverObject(INTERACTIVES_OBJECTS[0].id);
    useStore.getState().discoverObject(INTERACTIVES_OBJECTS[1].id);

    vi.advanceTimersByTime(1100);

    expect(onCheat).not.toHaveBeenCalled();
  });
});
