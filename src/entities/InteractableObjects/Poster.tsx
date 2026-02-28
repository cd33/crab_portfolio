import { useTexture } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

interface PosterProps {
  img?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
  isHighlighted?: boolean;
}

/**
 * Poster mural interactif
 */
export function Poster({
  img,
  position,
  rotation = [0, 0, 0],
  onClick,
  isHighlighted = false,
}: PosterProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const imageTexturePath = img ?? '/image692.jpg';
  const texture = useTexture(imageTexturePath);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <planeGeometry args={[1.3, 1.6]} />
      <meshStandardMaterial
        map={texture}
        emissive={isHighlighted ? 0x9575cd : 0x000000}
        emissiveIntensity={isHighlighted ? 2.4 : 0}
      />
    </mesh>
  );
}
