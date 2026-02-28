import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';

export type AccessoryType = 'hat-pokemon' | 'hat-crisis' | null;

interface AccessoryProps {
  type: AccessoryType;
  head?: THREE.Object3D | null;
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

  useEffect(() => {
    if (!head || !type) return;

    let gltfScene: THREE.Object3D | null = null;
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
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.Material && 'color' in mat) {
                (mat.color as THREE.Color).set('#800020');
              }
            });
          } else if (child.material instanceof THREE.Material && 'color' in child.material) {
            (child.material.color as THREE.Color).set('#800020');
          }
        }
      });
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
  }, [head, type, pokemonGltf.scene, crisisGltf.scene]);

  if (!type) return null;

  return null;
}

// Préchargement des modèles pour performance
useGLTF.preload('/models/hat_pokemon.glb');
useGLTF.preload('/models/hat_crisis.glb');
