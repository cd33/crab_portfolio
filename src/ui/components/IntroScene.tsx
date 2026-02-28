import { useI18n } from '@/hooks/useI18n';
import { useEffect, useRef, useState } from 'react';
import './IntroScene.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

/**
 * Canvas avec particules flottantes 2D
 */
function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Créer les particules
    const particleCount = 200;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
    }));

    // Animation
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const minDim = Math.min(canvas.width, canvas.height);
      const radius = 0.4 * (minDim / 2); // Masquer pour protéger le centre

      particlesRef.current.forEach((p) => {
        // Déplacer
        p.x += p.vx;
        p.y += p.vy;

        // Rebondir sur les bords
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Ne dessiner que si en dehors du centre
        const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
        if (dist > radius) {
          // Dessiner
          ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="intro-particles-canvas" />;
}

/**
 * Overlay d'intro avec vignette circulaire
 * S'affiche par-dessus la scène principale et s'ouvre au clic
 */
interface IntroOverlayProps {
  onCrabClick: () => void;
}

export function IntroOverlay({ onCrabClick }: IntroOverlayProps) {
  const { t } = useI18n();
  const [opening, setOpening] = useState(false);

  const handleClick = () => {
    if (opening) return; // Éviter les déclenchements multiples
    setOpening(true);
    setTimeout(() => {
      onCrabClick();
    }, 1500);
  };

  useEffect(() => {
    const handleKeyDown = () => {
      handleClick();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pas de dépendance pour éviter re-add

  return (
    <div className={`intro-overlay-container ${opening ? 'opening' : ''}`} onClick={handleClick}>
      {/* Vignette circulaire qui masque tout sauf le centre */}
      <div className="intro-vignette" />
      {/* Particules en arrière-plan */}
      <ParticlesCanvas />
      {/* Texte d'instruction */}
      <div className="intro-text-overlay">
        <p className="intro-instruction pulsing">{t('intro.start')}</p>
      </div>
    </div>
  );
}
