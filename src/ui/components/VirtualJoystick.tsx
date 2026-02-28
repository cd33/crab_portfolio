import { useI18n } from '@/hooks/useI18n';
import { useEffect, useRef, useState } from 'react';

interface JoystickPosition {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

interface VirtualJoystickProps {
  onMove: (position: JoystickPosition) => void;
  onStop: () => void;
}

/**
 * VirtualJoystick - Touch controls for mobile devices
 * Provides WASD-like movement via touch interface
 */
export function VirtualJoystick({ onMove, onStop }: VirtualJoystickProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState<JoystickPosition>({ x: 0, y: 0 });

  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const maxDistanceRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Calculate joystick dimensions
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      maxDistanceRef.current = rect.width / 2 - 20; // Subtract knob radius
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      setIsActive(true);
      updatePosition(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchIdRef.current === null) return;

      const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchIdRef.current);
      if (touch) {
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchIdRef.current);
      if (touch) {
        touchIdRef.current = null;
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
        onStop();
      }
    };

    const updatePosition = (clientX: number, clientY: number) => {
      const deltaX = clientX - centerRef.current.x;
      const deltaY = clientY - centerRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Clamp to max distance
      const clampedDistance = Math.min(distance, maxDistanceRef.current);
      const angle = Math.atan2(deltaY, deltaX);

      // Calculate clamped position
      const clampedX = clampedDistance * Math.cos(angle);
      const clampedY = clampedDistance * Math.sin(angle);

      // Normalize to -1 to 1
      const normalizedX = clampedX / maxDistanceRef.current;
      const normalizedY = clampedY / maxDistanceRef.current;

      setPosition({ x: normalizedX, y: normalizedY });
      onMove({ x: normalizedX, y: normalizedY });

      // Update knob visual position
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [onMove, onStop]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-8 left-8 w-32 h-32 touch-none select-none z-50"
      style={{ opacity: 0.7 }}
      aria-label={t('joystick.ariaLabel')}
      role="button"
      tabIndex={0}
    >
      {/* Joystick base */}
      <div
        className={`
          w-full h-full rounded-full 
          bg-gradient-to-b from-tunic-steel/40 to-tunic-steel/60
          border-4 border-tunic-steel/80
          shadow-lg
          transition-all duration-200
          ${isActive ? 'scale-110 border-tunic-green' : 'scale-100'}
        `}
      >
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-tunic-beige/50" />
      </div>

      {/* Knob */}
      <div
        ref={knobRef}
        className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-16 h-16 rounded-full
          bg-gradient-to-b from-tunic-beige to-tunic-sand
          border-4 border-tunic-steel
          shadow-xl
          transition-all duration-100
          ${isActive ? 'scale-110' : 'scale-100'}
        `}
        style={{
          transition: isActive ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {/* Direction indicators */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-60">
            <path
              d="M12 2L12 22M2 12L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-tunic-steel"
            />
          </svg>
        </div>
      </div>

      {/* Debug info (dev only) */}
      {import.meta.env.DEV && isActive && (
        <div className="absolute -top-8 left-0 right-0 text-center text-xs text-tunic-steel font-mono bg-white/90 rounded px-2 py-1">
          x: {position.x.toFixed(2)} y: {position.y.toFixed(2)}
        </div>
      )}
    </div>
  );
}
