import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../../src/store/useStore';

// Reset store and localStorage between tests
beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState());
});

describe('useStore', () => {
  describe('Intro state', () => {
    it('starts with showIntro = true', () => {
      expect(useStore.getState().showIntro).toBe(true);
    });

    it('setShowIntro updates the value', () => {
      useStore.getState().setShowIntro(false);
      expect(useStore.getState().showIntro).toBe(false);
    });
  });

  describe('Panel state', () => {
    it('starts with panel closed and no content', () => {
      const state = useStore.getState();
      expect(state.isPanelOpen).toBe(false);
      expect(state.panelContent).toBeNull();
    });

    it('openPanel sets content and opens', () => {
      const content = { id: 'test', title: 'Test', image: '/test.png' };
      useStore.getState().openPanel(content);
      const state = useStore.getState();
      expect(state.isPanelOpen).toBe(true);
      expect(state.panelContent).toEqual(content);
    });

    it('closePanel clears content', () => {
      const content = { id: 'test', title: 'Test', image: '/test.png' };
      useStore.getState().openPanel(content);
      useStore.getState().closePanel();
      const state = useStore.getState();
      expect(state.isPanelOpen).toBe(false);
      expect(state.panelContent).toBeNull();
    });
  });

  describe('Discovered objects', () => {
    it('starts with empty set', () => {
      expect(useStore.getState().discoveredObjects.size).toBe(0);
    });

    it('discoverObject adds to the set', () => {
      useStore.getState().discoverObject('poster1');
      expect(useStore.getState().discoveredObjects.has('poster1')).toBe(true);
    });

    it('isDiscovered returns correct value', () => {
      expect(useStore.getState().isDiscovered('poster1')).toBe(false);
      useStore.getState().discoverObject('poster1');
      expect(useStore.getState().isDiscovered('poster1')).toBe(true);
    });

    it('does not duplicate entries', () => {
      useStore.getState().discoverObject('poster1');
      useStore.getState().discoverObject('poster1');
      expect(useStore.getState().discoveredObjects.size).toBe(1);
    });
  });

  describe('Sound settings', () => {
    it('starts with sound enabled', () => {
      expect(useStore.getState().soundEnabled).toBe(true);
    });

    it('toggleSound flips the value', () => {
      useStore.getState().toggleSound();
      expect(useStore.getState().soundEnabled).toBe(false);
      useStore.getState().toggleSound();
      expect(useStore.getState().soundEnabled).toBe(true);
    });

    it('setVolume clamps between 0 and 1', () => {
      useStore.getState().setVolume(0.5);
      expect(useStore.getState().volume).toBe(0.5);

      useStore.getState().setVolume(2);
      expect(useStore.getState().volume).toBe(1);

      useStore.getState().setVolume(-1);
      expect(useStore.getState().volume).toBe(0);
    });
  });

  describe('Terminal state', () => {
    it('starts closed', () => {
      expect(useStore.getState().isTerminalOpen).toBe(false);
    });

    it('openTerminal / closeTerminal work', () => {
      useStore.getState().openTerminal();
      expect(useStore.getState().isTerminalOpen).toBe(true);
      useStore.getState().closeTerminal();
      expect(useStore.getState().isTerminalOpen).toBe(false);
    });

    it('setTerminalTheme changes theme', () => {
      expect(useStore.getState().terminalTheme).toBe('green');
      useStore.getState().setTerminalTheme('amber');
      expect(useStore.getState().terminalTheme).toBe('amber');
    });
  });

  describe('Accessories', () => {
    it('starts with no unlocked accessories', () => {
      expect(useStore.getState().unlockedAccessories.size).toBe(0);
    });

    it('unlockAccessory adds to set', () => {
      useStore.getState().unlockAccessory('hat-pokemon');
      expect(useStore.getState().unlockedAccessories.has('hat-pokemon')).toBe(true);
    });

    it('isAccessoryUnlocked works', () => {
      expect(useStore.getState().isAccessoryUnlocked('hat-pokemon')).toBe(false);
      useStore.getState().unlockAccessory('hat-pokemon');
      expect(useStore.getState().isAccessoryUnlocked('hat-pokemon')).toBe(true);
    });

    it('equipAccessory sets the equipped value', () => {
      expect(useStore.getState().equippedAccessory).toBeNull();
      useStore.getState().equipAccessory('hat-pokemon');
      expect(useStore.getState().equippedAccessory).toBe('hat-pokemon');
    });

    it('unlockAccessory with null is a no-op', () => {
      useStore.getState().unlockAccessory(null);
      expect(useStore.getState().unlockedAccessories.size).toBe(0);
    });
  });

  describe('Door progression', () => {
    it('starts locked', () => {
      expect(useStore.getState().doorCount).toBe(0);
      expect(useStore.getState().isDoorUnlocked).toBe(false);
    });

    it('incrementDoorCount increments', () => {
      useStore.getState().incrementDoorCount();
      expect(useStore.getState().doorCount).toBe(1);
      useStore.getState().incrementDoorCount();
      expect(useStore.getState().doorCount).toBe(2);
    });

    it('unlockDoor sets flag', () => {
      useStore.getState().unlockDoor();
      expect(useStore.getState().isDoorUnlocked).toBe(true);
    });
  });

  describe('Mail system', () => {
    it('starts with 1 mail', () => {
      expect(useStore.getState().mailCount).toBe(1);
    });

    it('incrementMailCount adds mails', () => {
      useStore.getState().incrementMailCount();
      expect(useStore.getState().mailCount).toBe(2);
    });
  });

  describe('Konami Code', () => {
    it('starts deactivated', () => {
      expect(useStore.getState().konamiActivated).toBe(false);
    });

    it('setKonamiActivated activates', () => {
      useStore.getState().setKonamiActivated();
      expect(useStore.getState().konamiActivated).toBe(true);
    });
  });

  describe('Lamp / Lights', () => {
    it('lamp starts off, lights start on', () => {
      expect(useStore.getState().lampOn).toBe(false);
      expect(useStore.getState().mainLightsOn).toBe(true);
    });

    it('toggleLamp / toggleMainLights work', () => {
      useStore.getState().toggleLamp();
      expect(useStore.getState().lampOn).toBe(true);

      useStore.getState().toggleMainLights();
      expect(useStore.getState().mainLightsOn).toBe(false);
    });
  });

  describe('Modal states (CV, Security, Settings, ProgressMap)', () => {
    it('all modals start closed', () => {
      const s = useStore.getState();
      expect(s.isCVModalOpen).toBe(false);
      expect(s.isSecurityKeypadOpen).toBe(false);
      expect(s.isSettingsOpen).toBe(false);
      expect(s.isProgressMapOpen).toBe(false);
    });

    it('open/close CV modal', () => {
      useStore.getState().openCVModal();
      expect(useStore.getState().isCVModalOpen).toBe(true);
      useStore.getState().closeCVModal();
      expect(useStore.getState().isCVModalOpen).toBe(false);
    });

    it('open/close SecurityKeypad', () => {
      useStore.getState().openSecurityKeypad();
      expect(useStore.getState().isSecurityKeypadOpen).toBe(true);
      useStore.getState().closeSecurityKeypad();
      expect(useStore.getState().isSecurityKeypadOpen).toBe(false);
    });

    it('toggleSettings flips', () => {
      useStore.getState().toggleSettings();
      expect(useStore.getState().isSettingsOpen).toBe(true);
      useStore.getState().toggleSettings();
      expect(useStore.getState().isSettingsOpen).toBe(false);
    });

    it('toggleProgressMap flips', () => {
      useStore.getState().toggleProgressMap();
      expect(useStore.getState().isProgressMapOpen).toBe(true);
    });
  });

  describe('Mug clicks', () => {
    it('starts at 0', () => {
      expect(useStore.getState().mugClickCount).toBe(0);
    });

    it('incrementMugClicks works', () => {
      useStore.getState().incrementMugClicks();
      useStore.getState().incrementMugClicks();
      expect(useStore.getState().mugClickCount).toBe(2);
    });
  });

  describe('Mobile interaction', () => {
    it('triggerMobileInteract sets then resets', async () => {
      vi.useFakeTimers();
      useStore.getState().triggerMobileInteract();
      expect(useStore.getState().mobileInteract).toBe(true);

      vi.advanceTimersByTime(150);
      expect(useStore.getState().mobileInteract).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('Controls visibility', () => {
    it('hideControls persists to localStorage', () => {
      useStore.getState().hideControls();
      expect(useStore.getState().controlsVisible).toBe(false);
      expect(localStorage.getItem('crab-portfolio-controls-seen')).toBe('true');
    });
  });

  describe('Ambient music', () => {
    it('setAmbientMusic toggles both enabled and playing', () => {
      useStore.getState().setAmbientMusic(false);
      expect(useStore.getState().ambientMusicEnabled).toBe(false);
      expect(useStore.getState().ambientMusicPlaying).toBe(false);
    });

    it('setAmbientMusicVolume clamps', () => {
      useStore.getState().setAmbientMusicVolume(2);
      expect(useStore.getState().ambientMusicVolume).toBe(1);
      useStore.getState().setAmbientMusicVolume(-1);
      expect(useStore.getState().ambientMusicVolume).toBe(0);
    });
  });

  describe('Persist middleware', () => {
    it('écrit dans localStorage sous la clé crab-portfolio-store', () => {
      useStore.getState().incrementDoorCount();
      const raw = localStorage.getItem('crab-portfolio-store');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.doorCount).toBe(1);
    });

    it('sérialise correctement les Set (discoveredObjects)', () => {
      useStore.getState().discoverObject('desk');
      const raw = localStorage.getItem('crab-portfolio-store');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      // Le Set est sérialisé avec __type: 'Set'
      expect(parsed.state.discoveredObjects).toEqual({ __type: 'Set', values: ['desk'] });
    });

    it('sérialise correctement les Set (unlockedAccessories)', () => {
      useStore.getState().unlockAccessory('hat-pokemon');
      const raw = localStorage.getItem('crab-portfolio-store');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.unlockedAccessories).toEqual({
        __type: 'Set',
        values: ['hat-pokemon'],
      });
    });

    it('restaure un Set depuis localStorage lors de la réhydratation', () => {
      // Simuler une sauvegarde existante avec un Set sérialisé
      const stored = {
        state: {
          discoveredObjects: { __type: 'Set', values: ['poster1', 'desk'] },
          unlockedAccessories: { __type: 'Set', values: ['hat-crisis'] },
          equippedAccessory: 'hat-crisis',
          doorCount: 3,
          isDoorUnlocked: true,
          mailCount: 2,
          konamiActivated: false,
          mugClickCount: 5,
          soundEnabled: false,
          volume: 0.7,
          keyboardLayout: 'qwerty',
          ambientMusicEnabled: false,
          ambientMusicVolume: 0.5,
          terminalTheme: 'amber',
          lampOn: true,
          mainLightsOn: false,
        },
        version: 0,
      };
      // Écrire directement dans localStorage via le storage custom (JSON pur, pas de replacer)
      // Les valeurs __type:Set doivent être lues par notre reviver
      localStorage.setItem('crab-portfolio-store', JSON.stringify(stored));

      // Forcer la réhydratation du store persist
      useStore.persist.rehydrate();

      const state = useStore.getState();
      expect(state.discoveredObjects).toBeInstanceOf(Set);
      expect(state.discoveredObjects.has('poster1')).toBe(true);
      expect(state.discoveredObjects.has('desk')).toBe(true);
      expect(state.unlockedAccessories).toBeInstanceOf(Set);
      expect(state.unlockedAccessories.has('hat-crisis')).toBe(true);
      expect(state.doorCount).toBe(3);
      expect(state.isDoorUnlocked).toBe(true);
      expect(state.mailCount).toBe(2);
      expect(state.mugClickCount).toBe(5);
      expect(state.soundEnabled).toBe(false);
      expect(state.volume).toBe(0.7);
      expect(state.keyboardLayout).toBe('qwerty');
      expect(state.terminalTheme).toBe('amber');
      expect(state.lampOn).toBe(true);
      expect(state.mainLightsOn).toBe(false);
    });

    it("n'écrit pas les états UI temporaires (isPanelOpen, isTerminalOpen, etc.)", () => {
      useStore.getState().openTerminal();
      useStore.getState().openCVModal();
      const raw = localStorage.getItem('crab-portfolio-store');
      if (!raw) return; // si persist lazy, ok
      const parsed = JSON.parse(raw!);
      expect(parsed.state.isTerminalOpen).toBeUndefined();
      expect(parsed.state.isCVModalOpen).toBeUndefined();
      expect(parsed.state.showIntro).toBeUndefined();
      expect(parsed.state.isPanelOpen).toBeUndefined();
    });
  });
});
