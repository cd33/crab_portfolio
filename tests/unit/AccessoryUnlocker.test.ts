import {
  getUnlockProgress,
  UNLOCK_CONDITIONS,
  useAccessoryUnlocker,
} from '@/interactions/AccessoryUnlocker';
import { useStore } from '@/store/useStore';
import { INTERACTIVES_OBJECTS } from '@/utils/constants';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TOTAL_OBJECTS = INTERACTIVES_OBJECTS.length;

function discoverAll() {
  const store = useStore.getState();
  INTERACTIVES_OBJECTS.forEach((obj) => store.discoverObject(obj.id));
}

// ---------------------------------------------------------------------------
// Reset store before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState());
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// UNLOCK_CONDITIONS
// ---------------------------------------------------------------------------
describe('UNLOCK_CONDITIONS', () => {
  describe('hat-pokemon (discover-all)', () => {
    it("check() retourne false si aucun objet n'est découvert", () => {
      const state = useStore.getState();
      expect(UNLOCK_CONDITIONS['hat-pokemon'].check!(state)).toBe(false);
    });

    it('check() retourne false si partiellement découvert', () => {
      useStore.getState().discoverObject(INTERACTIVES_OBJECTS[0].id);
      const state = useStore.getState();
      expect(UNLOCK_CONDITIONS['hat-pokemon'].check!(state)).toBe(false);
    });

    it('check() retourne true si tous les objets sont découverts', () => {
      discoverAll();
      const state = useStore.getState();
      expect(UNLOCK_CONDITIONS['hat-pokemon'].check!(state)).toBe(true);
    });

    it('a une description i18n définie', () => {
      expect(typeof UNLOCK_CONDITIONS['hat-pokemon'].description).toBe('string');
      expect(UNLOCK_CONDITIONS['hat-pokemon'].description.length).toBeGreaterThan(0);
    });

    it('a le type discover-all', () => {
      expect(UNLOCK_CONDITIONS['hat-pokemon'].type).toBe('discover-all');
    });
  });

  describe('hat-crisis', () => {
    it("n'a pas de fonction check (débloqué manuellement)", () => {
      expect(UNLOCK_CONDITIONS['hat-crisis'].check).toBeUndefined();
    });

    it('a le type crisis', () => {
      expect(UNLOCK_CONDITIONS['hat-crisis'].type).toBe('crisis');
    });
  });
});

// ---------------------------------------------------------------------------
// getUnlockProgress
// ---------------------------------------------------------------------------
describe('getUnlockProgress', () => {
  it('retourne des zéros pour null', () => {
    const progress = getUnlockProgress(null);
    expect(progress.current).toBe(0);
    expect(progress.required).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  describe('hat-pokemon', () => {
    it('retourne 0% si rien découvert', () => {
      const progress = getUnlockProgress('hat-pokemon');
      expect(progress.current).toBe(0);
      expect(progress.required).toBe(TOTAL_OBJECTS);
      expect(progress.percentage).toBe(0);
    });

    it('retourne un pourcentage partiel', () => {
      // Découvrir la moitié des objets
      const half = Math.floor(TOTAL_OBJECTS / 2);
      for (let i = 0; i < half; i++) {
        useStore.getState().discoverObject(INTERACTIVES_OBJECTS[i].id);
      }
      const progress = getUnlockProgress('hat-pokemon');
      expect(progress.current).toBe(half);
      expect(progress.percentage).toBeCloseTo((half / TOTAL_OBJECTS) * 100);
    });

    it('retourne 100% si tout découvert', () => {
      discoverAll();
      const progress = getUnlockProgress('hat-pokemon');
      expect(progress.current).toBe(TOTAL_OBJECTS);
      expect(progress.required).toBe(TOTAL_OBJECTS);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('hat-crisis', () => {
    it("retourne 0% si l'accessoire n'est pas débloqué", () => {
      const progress = getUnlockProgress('hat-crisis');
      expect(progress.current).toBe(0);
      expect(progress.required).toBe(1);
      expect(progress.percentage).toBe(0);
    });

    it("retourne 100% si l'accessoire est débloqué", () => {
      useStore.getState().unlockAccessory('hat-crisis');
      const progress = getUnlockProgress('hat-crisis');
      expect(progress.current).toBe(1);
      expect(progress.percentage).toBe(100);
    });
  });
});

// ---------------------------------------------------------------------------
// useAccessoryUnlocker hook
// ---------------------------------------------------------------------------
describe('useAccessoryUnlocker', () => {
  it('ne débloque pas hat-pokemon si les conditions ne sont pas remplies', () => {
    vi.useFakeTimers();

    renderHook(() => useAccessoryUnlocker());

    vi.advanceTimersByTime(6000);

    expect(useStore.getState().isAccessoryUnlocked('hat-pokemon')).toBe(false);
  });

  it('débloque hat-pokemon immédiatement si tous les objets sont déjà découverts', () => {
    vi.useFakeTimers();
    discoverAll();

    renderHook(() => useAccessoryUnlocker());

    // L'effet s'exécute au premier render (vérification immédiate)
    expect(useStore.getState().isAccessoryUnlocked('hat-pokemon')).toBe(true);
  });

  it('débloque hat-pokemon après le polling si objets découverts en cours de route', () => {
    vi.useFakeTimers();

    renderHook(() => useAccessoryUnlocker());
    expect(useStore.getState().isAccessoryUnlocked('hat-pokemon')).toBe(false);

    // Découvrir tous les objets
    discoverAll();

    // Avancer le timer de polling (5000ms)
    vi.advanceTimersByTime(5100);

    expect(useStore.getState().isAccessoryUnlocked('hat-pokemon')).toBe(true);
  });

  it('ne débloque pas deux fois le même accessoire', () => {
    vi.useFakeTimers();
    discoverAll();
    useStore.getState().unlockAccessory('hat-pokemon');

    const initialSize = useStore.getState().unlockedAccessories.size;
    renderHook(() => useAccessoryUnlocker());
    vi.advanceTimersByTime(6000);

    expect(useStore.getState().unlockedAccessories.size).toBe(initialSize);
  });
});
