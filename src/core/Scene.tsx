import { Crab } from '@/entities/Crab/Crab';
import { EnvironmentBackground } from '@/entities/Environment/EnvironmentBackground';
import { WorkspaceScene } from '@/entities/Environment/WorkspaceScene';
import { AdaptiveDpr, Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { performanceMonitor } from '@utils/performance';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Camera } from './Camera';
import { Lights } from './Lights';

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
      shadows={quality.shadows ? { type: THREE.PCFSoftShadowMap } : false}
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

      {/* Suspense for lazy loading 3D models */}
      <Suspense fallback={null}>
        {/* 3D environment background (sky, mountains, trees, particles) */}
        <EnvironmentBackground />

        {/* Blender workspace environment */}
        <WorkspaceScene />

        {/* Player character */}
        <Crab />
      </Suspense>
    </Canvas>
  );
}
