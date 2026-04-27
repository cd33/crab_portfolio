import { AdaptiveDpr, Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { performanceMonitor } from '@utils/performance';
import { Suspense, lazy, useEffect, useState } from 'react';
import { PCFSoftShadowMap } from 'three';
import { Camera } from './Camera';
import { Lights } from './Lights';
import { ModelFallbackBox, SceneErrorBoundary } from './SceneErrorBoundary';

const EnvironmentBackground = lazy(() =>
  import('@/entities/Environment/EnvironmentBackground').then((m) => ({
    default: m.EnvironmentBackground,
  }))
);
const WorkspaceScene = lazy(() =>
  import('@/entities/Environment/WorkspaceScene').then((m) => ({ default: m.WorkspaceScene }))
);
const Crab = lazy(() => import('@/entities/Crab/Crab').then((m) => ({ default: m.Crab })));

interface SceneProps {
  /** Show performance stats in development mode */
  showStats?: boolean;
}

const isMobile =
  typeof navigator !== 'undefined' &&
  (navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

/**
 * Main Three.js Scene Component
 * Renders the 3D environment with crab, lights, camera, and office furniture
 */
export function Scene({ showStats = import.meta.env.DEV }: SceneProps) {
  const [quality, setQuality] = useState(() => {
    const q = performanceMonitor.getQualitySettings();
    // Sur mobile, on commence directement avec des ombres désactivées
    if (isMobile) return { shadows: false, shadowMapSize: 512 };
    return q;
  });

  // Monitor performance and adjust quality
  useEffect(() => {
    const interval = setInterval(() => {
      const newQuality = performanceMonitor.getQualitySettings();
      setQuality(newQuality);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Canvas
      aria-label="Interactive 3D scene - use WASD to move the crab"
      role="application"
      shadows={quality.shadows ? { type: PCFSoftShadowMap } : false}
      camera={{ position: [0, 6, 8], fov: 50 }}
      gl={{
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        antialias: !isMobile, // désactiver l'anti-aliasing sur mobile pour les perfs
      }}
      dpr={isMobile ? [0.5, 1] : [1, 2]} // DPR réduit sur mobile
      frameloop="always"
      performance={{ min: isMobile ? 0.3 : 0.5 }}
      style={{ width: '100%', height: '100%' }}
      onCreated={() => {
        window.__SCENE_READY__ = true;
      }}
    >
      {/* Fond d'environnement chaleureux (remplace le noir) */}
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#C8D8E8', 30, 75]} />

      {/* Adaptive DPR - automatically lowers resolution when FPS drops */}
      <AdaptiveDpr pixelated />

      {/* Show FPS stats in development */}
      {showStats && <Stats />}

      {/* Lighting setup */}
      <Lights />

      {/* Camera that follows the crab */}
      <Camera />

      {/* Each lazy model has its own Suspense + ErrorBoundary so a single
          failed asset does not take down the entire scene. */}
      <SceneErrorBoundary>
        <Suspense fallback={null}>
          <EnvironmentBackground />
        </Suspense>
      </SceneErrorBoundary>

      <SceneErrorBoundary>
        <Suspense fallback={null}>
          <WorkspaceScene />
        </Suspense>
      </SceneErrorBoundary>

      <SceneErrorBoundary fallback={<ModelFallbackBox position={[0, 0.5, 0]} />}>
        <Suspense fallback={null}>
          <Crab />
        </Suspense>
      </SceneErrorBoundary>
    </Canvas>
  );
}
