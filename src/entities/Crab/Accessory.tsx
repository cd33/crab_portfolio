import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import { Color, Material, Mesh, Object3D } from 'three';

export type AccessoryType = 'hat-pokemon' | 'hat-crisis' | 'hat-potter' | 'pixel-glasses' | null;

interface AccessoryProps {
  type: AccessoryType;
  head?: Object3D | null;
}

/**
 * Accessory Component - Cosmetic items for the crab
 *
 * Displays unlockable accessories (hats) on top of the crab's head
 * Uses procedural geometry as placeholders until proper 3D models are created
 */
export function Accessory({ type, head }: AccessoryProps) {
  const pokemonGltf = useGLTF('/models/hat_pokemon.glb');
  const crisisGltf = useGLTF('/models/hat_crisis.glb');
  const potterGltf = useGLTF('/models/potter.glb');
  const glassesGltf = useGLTF('/models/pixel_glasses.glb');

  useEffect(() => {
    if (!head || !type) return;

    let gltfScene: Object3D | null = null;
    let position: [number, number, number] = [0, 0.1, -0.39];
    let rotation: [number, number, number] = [-2.5, 2.75, 0];
    let scale: [number, number, number] = [1.8, 1.8, 1.8];

    if (type === 'hat-pokemon') {
      gltfScene = pokemonGltf.scene;
    } else if (type === 'hat-crisis') {
      gltfScene = crisisGltf.scene;
      position = [-0.03, 0, -0.39];
      rotation = [0.9, 0.14, -0.08];
      scale = [0.5, 0.5, 0.5];

      // Changer la couleur en rouge bordeaux
      gltfScene.traverse((child) => {
        if (child instanceof Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof Material && 'color' in mat) {
                (mat.color as Color).set('#800020');
              }
            });
          } else if (child.material instanceof Material && 'color' in child.material) {
            (child.material.color as Color).set('#800020');
          }
        }
      });
    } else if (type === 'hat-potter') {
      gltfScene = potterGltf.scene;
      position = [0, 0, -0.38];
      rotation = [-1.9, -0.9, 0.4];
      scale = [1.6, 1.6, 1.6];
    } else if (type === 'pixel-glasses') {
      gltfScene = glassesGltf.scene;
      position = [0, 0.51, -0.27];
      rotation = [1, Math.PI, 3.25];
      scale = [0.5, 0.5, 0.5];
    }

    if (gltfScene) {
      head.add(gltfScene);
      gltfScene.position.set(...position);
      gltfScene.rotation.set(...rotation);
      gltfScene.scale.set(...scale);
      return () => {
        head.remove(gltfScene!);
      };
    }
  }, [head, type, pokemonGltf.scene, crisisGltf.scene, potterGltf.scene, glassesGltf.scene]);

  if (!type) return null;

  return null;
}

// Préchargement des modèles pour performance
useGLTF.preload('/models/hat_pokemon.glb');
useGLTF.preload('/models/hat_crisis.glb');
useGLTF.preload('/models/potter.glb');
useGLTF.preload('/models/pixel_glasses.glb');
