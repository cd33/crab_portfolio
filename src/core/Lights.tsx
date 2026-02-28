import { useStore } from '@/store/useStore';
import { performanceMonitor } from '@utils/performance';
import { useEffect, useState } from 'react';

/**
 * Lighting Configuration for low poly Scene
 * Provides soft, pastel lighting with ambient, directional, and hemisphere lights
 * Color palette: Beige ambient, Steel directional, Green ground
 */
export function Lights() {
  const mainLightsOn = useStore((state) => state.mainLightsOn);
  const [quality, setQuality] = useState(performanceMonitor.getQualitySettings());

  useEffect(() => {
    const interval = setInterval(() => {
      setQuality(performanceMonitor.getQualitySettings());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Ambient light - Always on (minimal) */}
      <ambientLight intensity={mainLightsOn ? 1.2 : 0.2} color="#FFE4B5" />
      {/* AccentLight - Accent ambre */}
      <pointLight position={[-3, 3.5, 2]} intensity={25} color="#FF9966" distance={10} decay={2} />
      {/* Exit Sign - Petite source rouge localisée */}
      <pointLight
        position={[-5.7, 3.82, 1.5]}
        intensity={10}
        color="#FF0000"
        distance={0.28}
        decay={1}
      />
      {mainLightsOn && (
        <>
          {/* MainSun - Directional light principale chaude*/}
          <directionalLight
            position={[10, 15, 10]}
            intensity={0.8}
            color="#FFF2E6" // Blanc chaud
            castShadow={quality.shadows}
            shadow-mapSize-width={quality.shadowMapSize}
            shadow-mapSize-height={quality.shadowMapSize}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.0001}
          />

          {/* WarmFill - Lumière d'appoint orange */}
          {/* <pointLight
            position={[5, 8, 3.79]}
            intensity={50}
            color="#FFBF80"
            distance={20}
            decay={2}
          /> */}

          {/* DeskLamp - Lumière de bureau orangée */}
          <pointLight
            position={[2, 2.5, 0]}
            intensity={10}
            color="#FFD999"
            distance={8}
            decay={2}
          />
          <pointLight
            position={[-2, 2.5, 0]}
            intensity={10}
            color="#FFD999"
            distance={8}
            decay={2}
          />

          {/* WindowLight - Lumière de fenêtre */}
          {/* <pointLight
            position={[-6, 3, 2]}
            intensity={40}
            color="#E6F2FF"
            distance={12}
            decay={2}
          /> */}

          {/* Hemisphere light - Simule l'HDRI ambiant */}
          {/* <hemisphereLight intensity={0.8} color="#F5E6D3" groundColor="#D4A574" /> */}
        </>
      )}
    </>
  );
}
