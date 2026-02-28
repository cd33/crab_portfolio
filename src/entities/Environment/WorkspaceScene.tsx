import { infosData } from '@/assets/data/content';
import { useCrabContext } from '@/core/useCrabContext';
import { Poster } from '@/entities/InteractableObjects/Poster';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useSound } from '@/hooks/useSound';
import { useStore } from '@/store/useStore';
import { useGLTF } from '@react-three/drei';
import type { GroupProps } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

// Centralisation des groupes interactifs
const INTERACTIVE_GROUPS = [
  {
    key: 'laptop',
    names: ['LaptopBase', 'LaptopScreen'],
  },
  {
    key: 'mug',
    names: ['Mug', 'MugHandle'],
  },
  {
    key: 'lamp',
    names: ['FloorLampBase', 'FloorLampLight', 'FloorLampPole', 'FloorLampShade'],
  },
  {
    key: 'cv',
    names: ['CV_Sheet'],
  },
  {
    key: 'switch',
    names: ['SwitchWall'],
  },
  {
    key: 'poster1',
    names: ['Poster1'],
  },
  {
    key: 'poster2',
    names: ['Poster2'],
  },
  {
    key: 'security_keypad',
    names: [
      'SecurityKeypad_1',
      'SecurityKeypad_2',
      'SecurityKeypad_3',
      'SecurityKeypad_4',
      'SecurityKeypad_5',
      'SecurityKeypad_6',
      'SecurityKeypad_7',
    ],
  },
  {
    key: 'door',
    names: ['Door', 'DoorHandle'],
  },
];

// Liste des meshes interactifs
const INTERACTIVE_NAMES = [
  'CV_Sheet',
  'LaptopBase',
  'LaptopScreen',
  'Mug',
  'MugHandle',
  'Plant',
  'FloorLampBase',
  'FloorLampLight',
  'FloorLampPole',
  'FloorLampShade',
  'SwitchWall',
  'Poster1',
  'Poster2',
  'SecurityKeypad_1',
  'SecurityKeypad_2',
  'SecurityKeypad_3',
  'SecurityKeypad_4',
  'SecurityKeypad_5',
  'SecurityKeypad_6',
  'SecurityKeypad_7',
  'Door',
  'DoorHandle',
];

/**
 * Workspace Scene - 3D isometric low-poly office environment
 * Created in Blender with warm materials and decorations
 * Includes: room structure, desk, computer, coffee mug, plants, decorations
 */
export function WorkspaceScene(props: GroupProps) {
  const { scene } = useGLTF('/models/workspace_scene.glb');
  const {
    soundEnabled,
    volume,
    openPanel,
    discoverObject,
    updateActivity,
    openTerminal,
    incrementMugClicks,
    openCVModal,
    openSecurityKeypad,
    lampOn,
    toggleLamp,
    toggleMainLights,
    isDoorUnlocked,
  } = useStore();
  const crabCtx = useCrabContext();
  const keys = useKeyboard();
  // Pour détecter le front montant de la touche interact
  const prevInteractRef = useRef(false);

  const coffeeSound = useSound('/sounds/drink-coffee.mp3', {
    volume: volume * 1,
    enabled: soundEnabled,
  });

  const interactiveMeshes = useMemo(() => {
    if (!scene) return [];
    const meshes: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && INTERACTIVE_NAMES.includes(child.name)) {
        if (child.name === 'Door' || child.name === 'DoorHandle') {
          if (isDoorUnlocked) {
            meshes.push(child);
          }
        } else {
          meshes.push(child);
        }
      }
    });
    return meshes;
  }, [scene, isDoorUnlocked]);

  // Utilitaire pour obtenir la position du crabe dans la scène
  const getCrabPos = useCallback(() => {
    return crabCtx?.position || { x: 0, y: 0, z: 0 };
  }, [crabCtx]);

  // Utilitaire pour grouper les meshes
  const groupedMeshes = useMemo(() => {
    const groups: Record<string, THREE.Mesh[]> = {};
    INTERACTIVE_GROUPS.forEach((g) => {
      groups[g.key] = interactiveMeshes.filter((m) => g.names.includes(m.name));
    });
    // Groupe "other"
    groups.other = interactiveMeshes.filter(
      (m) => !INTERACTIVE_GROUPS.some((g) => g.names.includes(m.name))
    );
    return groups;
  }, [interactiveMeshes]);

  // Trouve le groupe le plus proche et la distance
  const getClosestGroup = useCallback(() => {
    const crabPos = getCrabPos();
    let closest: { key: string; dist: number } = { key: '', dist: Infinity };
    Object.entries(groupedMeshes).forEach(([key, meshes]) => {
      if (meshes.length === 0) return;
      const minDist = Math.min(
        ...meshes.map((m) => {
          const worldPos = new THREE.Vector3();
          m.getWorldPosition(worldPos);
          const dx = worldPos.x - crabPos.x;
          const dz = worldPos.z - crabPos.z;
          return Math.sqrt(dx * dx + dz * dz);
        })
      );
      if (minDist < closest.dist) {
        closest = { key, dist: minDist };
      }
    });
    return closest.dist < 1.5 ? closest.key : null;
  }, [groupedMeshes, getCrabPos]);

  // Gestionnaire d'interaction
  const handleMeshClick = useCallback(
    (name: string) => {
      if (name === 'CV_Sheet') {
        openCVModal();
        discoverObject('cv_sheet');
      } else if (name === 'LaptopBase' || name === 'LaptopScreen') {
        openTerminal();
        discoverObject('computer');
      } else if (name === 'Mug' || name === 'MugHandle') {
        coffeeSound.stop();
        coffeeSound.play();
        discoverObject('mug');
        incrementMugClicks();
      } else if (name.startsWith('FloorLampBase')) {
        if (typeof toggleLamp === 'function') toggleLamp();
        discoverObject('lamp');
      } else if (name === 'SwitchWall') {
        if (typeof toggleMainLights === 'function') toggleMainLights();
        discoverObject('switch');
      } else if (name === 'Poster1') {
        openPanel(infosData.poster1);
        discoverObject('poster_1');
      } else if (name === 'Poster2') {
        openPanel(infosData.poster2);
        discoverObject('poster_2');
      } else if (name.startsWith('SecurityKeypad')) {
        openSecurityKeypad();
        discoverObject('keypad');
      } else if (name === 'Door' || name === 'DoorHandle') {
        openPanel(infosData.endgame);
      }
      updateActivity();
    },
    [
      openCVModal,
      discoverObject,
      updateActivity,
      openTerminal,
      incrementMugClicks,
      openPanel,
      openSecurityKeypad,
      toggleLamp,
      toggleMainLights,
      coffeeSound,
    ]
  );

  // Activation par touche 'e' uniquement sur front montant et si le groupe change
  const lastActivatedGroupRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevInteractRef.current;
    if (keys.interact && !prev) {
      const closestKey = getClosestGroup();
      if (closestKey && lastActivatedGroupRef.current !== closestKey) {
        const meshes = groupedMeshes[closestKey];
        if (meshes && meshes.length > 0) {
          handleMeshClick(meshes[0].name);
          lastActivatedGroupRef.current = closestKey;
        }
      }
    }
    if (!keys.interact) {
      lastActivatedGroupRef.current = null;
    }
    prevInteractRef.current = keys.interact;
  }, [keys.interact, getClosestGroup, groupedMeshes, handleMeshClick]);

  // Activer les ombres sur tous les meshes de la scène
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Calculer une fois le groupe le plus proche
  const closestGroup = getClosestGroup();

  useEffect(() => {
    if (!scene) return;
    // Réinitialiser tous les matériaux
    interactiveMeshes.forEach((mesh) => {
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (mat && mat instanceof THREE.MeshStandardMaterial) {
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
    // Appliquer le surlignage au groupe le plus proche
    if (closestGroup && groupedMeshes[closestGroup]) {
      groupedMeshes[closestGroup].forEach((mesh) => {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (mat && mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive.set(0x9575cd);
          mat.emissiveIntensity = 2.4;
        }
      });
    }
  }, [scene, interactiveMeshes, closestGroup, groupedMeshes]);

  if (!scene) return null;
  // Récupère la position de FloorLampLight dans la scène
  let lampLightPos: [number, number, number] = [4.5, 2.45, 3.5];
  const lampObj = scene.getObjectByName('FloorLampLight');
  if (lampObj) {
    lampLightPos = [lampObj.position.x, lampObj.position.y, lampObj.position.z];
  }

  return (
    <group
      position={props.position || [0, 0, 0]}
      scale={props.scale || 1}
      rotation={[0, Math.PI, 0]}
      {...props}
    >
      {/* Décor complet */}
      <primitive object={scene} castShadow receiveShadow />
      {/* Ajoute une vraie lumière contrôlée par lampOn */}
      {lampOn && (
        <pointLight
          position={lampLightPos}
          intensity={15}
          color={0xffd700}
          distance={6}
          decay={2}
        />
      )}

      {/* Posters muraux interactifs */}
      <Poster
        position={[-3, 3, 4.8]}
        rotation={[0, Math.PI, 0]}
        isHighlighted={closestGroup === 'poster1'}
        img="/kandinsky_wall.png"
      />
      <Poster
        position={[3, 3, 4.8]}
        rotation={[0, Math.PI, 0]}
        isHighlighted={closestGroup === 'poster2'}
        img="/chagall_wall.png"
      />
    </group>
  );
}

// Preload the model for better performance
useGLTF.preload('/models/workspace_scene.glb');
