import { Crab } from '@/entities/Crab/Crab';
import { WorkspaceScene } from '@/entities/Environment/WorkspaceScene';
import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { performanceMonitor } from '@utils/performance';
import { Suspense, useEffect, useState } from 'react';
import { Camera } from './Camera';
import { Lights } from './Lights';

interface SceneProps {
  /** Show performance stats in development mode */
  showStats?: boolean;
}

/**
 * Main Three.js Scene Component
 * Renders the 3D environment with crab, lights, camera, and office furniture
 */
export function Scene({ showStats = import.meta.env.DEV }: SceneProps) {
  const [quality, setQuality] = useState(performanceMonitor.getQualitySettings());

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
      shadows={quality.shadows}
      camera={{ position: [0, 6, 8], fov: 50 }}
      gl={{
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      dpr={[1, 2]} // Limit pixel ratio to max 2 for performance
      frameloop="always"
      performance={{ min: 0.5 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Fond d'environnement chaleureux (remplace le noir) */}
      <color attach="background" args={['#E8DCC4']} />
      <fog attach="fog" args={['#E8DCC4', 15, 30]} />

      {/* Show FPS stats in development */}
      {showStats && <Stats />}

      {/* Lighting setup */}
      <Lights />

      {/* Camera that follows the crab */}
      <Camera />

      {/* Suspense for lazy loading 3D models */}
      <Suspense fallback={null}>
        {/* Blender workspace environment */}
        <WorkspaceScene />

        {/* Player character */}
        <Crab />
      </Suspense>
    </Canvas>
  );
}
