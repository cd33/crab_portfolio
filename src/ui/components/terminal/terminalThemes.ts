export const TERMINAL_THEMES = {
  green: {
    text: '#00FF00',
    textClass: 'text-green-500',
    glow: 'rgba(0, 255, 0, 0.8)',
    glowLight: 'rgba(0, 255, 0, 0.4)',
    bgOverlay: 'bg-green-500/5',
    scanlines: 'rgba(0, 255, 0, 0.03)',
  },
  amber: {
    text: '#FFBF00',
    textClass: 'text-amber-500',
    glow: 'rgba(255, 191, 0, 0.8)',
    glowLight: 'rgba(255, 191, 0, 0.4)',
    bgOverlay: 'bg-amber-500/5',
    scanlines: 'rgba(255, 191, 0, 0.03)',
  },
} as const;

export type TerminalTheme = keyof typeof TERMINAL_THEMES;
