import { useMemo } from 'react';

const COLORS = ['#8bc34a', '#f9a825', '#e91e63', '#2196f3', '#ff5722', '#9c27b0', '#00bcd4'];
const SHAPES = ['rounded-full', 'rounded-none', 'rounded-sm'];

interface ConfettiPiece {
  id: number;
  left: string;
  color: string;
  shape: string;
  size: number;
  duration: string;
  delay: string;
  width: number;
  height: number;
}

/**
 * Lightweight CSS confetti - no external library.
 * Renders ~28 colored pieces that fall from the top of the container.
 * The parent must have `position: relative` and `overflow: hidden`.
 */
export function Confetti({ count = 28 }: { count?: number }) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i / count) * 100 + (((i * 7) % 11) - 5)}%`,
      color: COLORS[i % COLORS.length],
      shape: SHAPES[i % SHAPES.length],
      size: 6 + (i % 5),
      width: i % 3 === 0 ? 4 : 8,
      height: i % 3 === 0 ? 12 : 8,
      duration: `${0.8 + (i % 6) * 0.15}s`,
      delay: `${(i % 8) * 0.07}s`,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute top-0 ${p.shape} animate-confettiFall`}
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
