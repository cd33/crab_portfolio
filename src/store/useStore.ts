import type { InfoContent } from '@/types';
import type { AccessoryType } from '@entities/Crab/Accessory';
import { create } from 'zustand';

type KeyboardLayout = 'azerty' | 'qwerty';

interface StoreState {
  // Intro state
  showIntro: boolean;
  setShowIntro: (show: boolean) => void;

  // Lamp state
  lampOn: boolean;
  toggleLamp: () => void;
  mainLightsOn: boolean;
  toggleMainLights: () => void;

  // Panel state
  isPanelOpen: boolean;
  panelContent: InfoContent | null;
  openPanel: (content: InfoContent) => void;
  closePanel: () => void;

  // Discovered objects tracking
  discoveredObjects: Set<string>;
  discoverObject: (objectId: string) => void;
  isDiscovered: (objectId: string) => boolean;

  // Progress Map
  isProgressMapOpen: boolean;
  toggleProgressMap: () => void;

  // Settings
  soundEnabled: boolean;
  volume: number;
  keyboardLayout: KeyboardLayout;
  toggleSound: () => void;
  setVolume: (volume: number) => void;
  setKeyboardLayout: (layout: KeyboardLayout) => void;

  // Ambient Music
  ambientMusicEnabled: boolean;
  ambientMusicPlaying: boolean;
  ambientMusicVolume: number;
  setAmbientMusic: (enabled?: boolean) => void;
  setAmbientMusicPlaying: (playing: boolean) => void;
  setAmbientMusicVolume: (volume: number) => void;

  // Easter Eggs & Accessories
  unlockedAccessories: Set<AccessoryType>;
  equippedAccessory: AccessoryType;
  unlockAccessory: (accessory: AccessoryType) => void;
  equipAccessory: (accessory: AccessoryType) => void;
  isAccessoryUnlocked: (accessory: AccessoryType) => boolean;

  // Easter egg tracking
  mugClickCount: number;
  incrementMugClicks: () => void;
  lastActivityTime: number;
  updateActivity: () => void;

  // Terminal state
  isTerminalOpen: boolean;
  openTerminal: () => void;
  closeTerminal: () => void;
  terminalTheme: 'green' | 'amber';
  setTerminalTheme: (theme: 'green' | 'amber') => void;

  // Mail system
  mailCount: number;
  incrementMailCount: () => void;

  // Door unlock progression
  doorCount: number;
  incrementDoorCount: () => void;
  isDoorUnlocked: boolean;
  unlockDoor: () => void;

  // Konami Code
  konamiActivated: boolean;
  setKonamiActivated: () => void;

  // CV Modal state
  isCVModalOpen: boolean;
  openCVModal: () => void;
  closeCVModal: () => void;

  // Security Keypad Modal state
  isSecurityKeypadOpen: boolean;
  openSecurityKeypad: () => void;
  closeSecurityKeypad: () => void;

  // Settings panel state
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;

  // Controls visibility
  controlsVisible: boolean;
  showControls: () => void;
  hideControls: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Intro state - afficher l'intro par défaut
  showIntro: true,
  setShowIntro: (show) => set({ showIntro: show }),

  // Panel state
  isPanelOpen: false,
  panelContent: null,
  openPanel: (content) => set({ isPanelOpen: true, panelContent: content }),
  closePanel: () => set({ isPanelOpen: false, panelContent: null }),

  // Discovered objects tracking
  discoveredObjects: new Set<string>(),
  discoverObject: (objectId) =>
    set((state) => {
      const newSet = new Set(state.discoveredObjects);
      newSet.add(objectId);
      return { discoveredObjects: newSet };
    }),
  isDiscovered: (objectId) => get().discoveredObjects.has(objectId),

  // Progress Map
  isProgressMapOpen: false,
  toggleProgressMap: () => set((state) => ({ isProgressMapOpen: !state.isProgressMapOpen })),

  // Settings
  soundEnabled: true,
  volume: 1,
  keyboardLayout:
    typeof navigator !== 'undefined' && navigator.language.startsWith('fr') ? 'azerty' : 'qwerty',
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setKeyboardLayout: (layout) => set({ keyboardLayout: layout }),

  // Ambient Music
  ambientMusicEnabled: true, // Activé par défaut pour démarrer au chargement
  ambientMusicPlaying: false,
  ambientMusicVolume: 0.3,
  setAmbientMusic: (enabled) =>
    set({
      ambientMusicEnabled: enabled,
      ambientMusicPlaying: enabled,
    }),
  setAmbientMusicPlaying: (playing) => set({ ambientMusicPlaying: playing }),
  setAmbientMusicVolume: (volume) => set({ ambientMusicVolume: Math.max(0, Math.min(1, volume)) }),

  // Easter Eggs & Accessories
  unlockedAccessories: new Set<AccessoryType>(),
  equippedAccessory: null,
  unlockAccessory: (accessory) =>
    set((state) => {
      if (!accessory) return state;
      const newSet = new Set(state.unlockedAccessories);
      newSet.add(accessory);
      return { unlockedAccessories: newSet };
    }),
  equipAccessory: (accessory) => set({ equippedAccessory: accessory }),
  isAccessoryUnlocked: (accessory) => {
    if (!accessory) return false;
    return get().unlockedAccessories.has(accessory);
  },

  // Easter egg tracking
  mugClickCount: 0,
  incrementMugClicks: () => set((state) => ({ mugClickCount: state.mugClickCount + 1 })),
  lastActivityTime: Date.now(),
  updateActivity: () => set({ lastActivityTime: Date.now() }),

  // Terminal state
  isTerminalOpen: false,
  openTerminal: () => set({ isTerminalOpen: true }),
  closeTerminal: () => set({ isTerminalOpen: false }),
  terminalTheme: 'green',
  setTerminalTheme: (theme) => set({ terminalTheme: theme }),

  // Mail system
  mailCount: 1,
  incrementMailCount: () => set((state) => ({ mailCount: state.mailCount + 1 })),

  // Door unlock progression
  doorCount: 0,
  incrementDoorCount: () => set((state) => ({ doorCount: state.doorCount + 1 })),
  isDoorUnlocked: false,
  unlockDoor: () => set({ isDoorUnlocked: true }),

  // Konami Code
  konamiActivated: false,
  setKonamiActivated: () => set({ konamiActivated: true }),

  // CV Modal state
  isCVModalOpen: false,
  openCVModal: () => set({ isCVModalOpen: true }),
  closeCVModal: () => set({ isCVModalOpen: false }),

  // Security Keypad Modal state
  isSecurityKeypadOpen: false,
  openSecurityKeypad: () => set({ isSecurityKeypadOpen: true }),
  closeSecurityKeypad: () => set({ isSecurityKeypadOpen: false }),

  // Settings panel state
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  // Controls visibility
  controlsVisible: (() => {
    if (typeof window === 'undefined') return true;
    const hasSeenControls = localStorage.getItem('crab-portfolio-controls-seen');
    return !hasSeenControls;
  })(),
  showControls: () => set({ controlsVisible: true }),
  hideControls: () => {
    localStorage.setItem('crab-portfolio-controls-seen', 'true');
    set({ controlsVisible: false });
  },

  // Lamp state
  lampOn: false,
  toggleLamp: () => set((state) => ({ lampOn: !state.lampOn })),

  // Main lights state (controlled by switch)
  mainLightsOn: true,
  toggleMainLights: () => set((state) => ({ mainLightsOn: !state.mainLightsOn })),
}));
