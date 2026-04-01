import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store/useStore';
import { useCallback, useEffect, useRef } from 'react';

interface MobileButtonsProps {
  onFirstTouch?: () => void;
}

/**
 * MobileButtons - Touch controls for mobile actions
 * Provides buttons for interaction, settings, and map
 */
export function MobileButtons({ onFirstTouch }: MobileButtonsProps) {
  const { t } = useI18n();
  const { toggleSettings, toggleProgressMap, triggerMobileInteract } = useStore();
  const interactPressedRef = useRef(false);
  const hasTriggeredFirstTouch = useRef(false);

  // Handle touch events for interact button
  const handleInteractTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!interactPressedRef.current) {
        interactPressedRef.current = true;
        triggerMobileInteract();

        // Trigger first touch callback (for music autoplay)
        if (!hasTriggeredFirstTouch.current && onFirstTouch) {
          hasTriggeredFirstTouch.current = true;
          onFirstTouch();
        }
      }
    },
    [triggerMobileInteract, onFirstTouch]
  );

  const handleInteractTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    interactPressedRef.current = false;
  }, []);

  // Reset interact state on unmount
  useEffect(() => {
    return () => {
      interactPressedRef.current = false;
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-4 flex flex-col gap-3 z-50">
      {/* Interact Button (E) */}
      <button
        onTouchStart={handleInteractTouchStart}
        onTouchEnd={handleInteractTouchEnd}
        className="
          w-16 h-16 rounded-full
          bg-gradient-to-b from-tunic-green to-tunic-green/80
          border-4 border-tunic-steel
          shadow-lg
          active:scale-95
          transition-all duration-100
          flex items-center justify-center
          touch-none
        "
        style={{ opacity: 0.8 }}
        aria-label={t('controls.interact')}
        type="button"
      >
        <span className="text-white text-2xl font-bold">E</span>
      </button>

      {/* Map Button (M) */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          toggleProgressMap();
        }}
        className="
          size-16 rounded-full
          bg-gradient-to-b from-tunic-sand to-tunic-sand/80
          border-4 border-tunic-steel
          shadow-lg
          active:scale-95
          transition-all duration-100
          flex items-center justify-center
          touch-none
        "
        style={{ opacity: 0.7 }}
        aria-label={t('controls.map')}
        type="button"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-tunic-steel"
        >
          <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      </button>

      {/* Settings Button (ESC) */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          toggleSettings();
        }}
        className="
          size-16 rounded-full
          bg-gradient-to-b from-tunic-beige to-tunic-beige/80
          border-4 border-tunic-steel
          shadow-lg
          active:scale-95
          transition-all duration-100
          flex items-center justify-center
          touch-none
        "
        style={{ opacity: 0.7 }}
        aria-label={t('controls.settings')}
        type="button"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-tunic-steel"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 5 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19 8.6a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19 15.4z" />
        </svg>
      </button>
    </div>
  );
}
