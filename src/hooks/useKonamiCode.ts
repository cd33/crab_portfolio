import { useStore } from '@/store/useStore';
import { useEffect } from 'react';
import { useSound } from './useSound';

const sequence = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];

export function useKonamiCode() {
  const { soundEnabled, volume, konamiActivated, setKonamiActivated } = useStore();
  const logSound = useSound('/sounds/positive-notification.mp3', {
    volume: volume * 1,
    enabled: soundEnabled,
  });

  useEffect(() => {
    // si konamiActivated est déjà true, ne rien faire
    if (konamiActivated) {
      return;
    }

    let currentIndex = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      let direction: string | null = null;

      // Map keys to directions
      if (key === 'a') {
        // 'a' can be 'left' or 'a' depending on sequence position
        if (currentIndex === 4 || currentIndex === 6) {
          direction = 'left';
        } else if (currentIndex === 9) {
          direction = 'a';
        }
      } else if (key === 'b') {
        direction = 'b';
      } else if (key === 'arrowup' || key === 'w' || key === 'z') {
        direction = 'up';
      } else if (key === 'arrowdown' || key === 's') {
        direction = 'down';
      } else if (key === 'arrowleft' || key === 'q') {
        direction = 'left';
      } else if (key === 'arrowright' || key === 'd') {
        direction = 'right';
      }

      // Check if the pressed key matches the next in sequence
      if (direction === sequence[currentIndex]) {
        currentIndex++;
        if (currentIndex === sequence.length) {
          setKonamiActivated();
          logSound.play();
          currentIndex = 0;
        }
      } else {
        currentIndex = 0; // Reset on wrong key
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [konamiActivated, logSound, setKonamiActivated]);
}
