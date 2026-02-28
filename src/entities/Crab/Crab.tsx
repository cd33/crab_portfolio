import { useStore } from '@/store/useStore';
import { useCrabContext } from '@core/useCrabContext';
import { useKeyboard } from '@hooks/useKeyboard';
import { useSound } from '@hooks/useSound';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MOVEMENT } from '@utils/constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import * as THREE from 'three';
import { AnimationAction, AnimationMixer, Box3, LoopOnce, LoopRepeat, Mesh, Vector3 } from 'three';
import { Accessory } from './Accessory';
import { useDanceAnimation, useIdleDetection, useYawnAnimation } from './CrabAnimations';
import { CrabController } from './CrabController';

/**
 * Crab Component - Player character
 * Controls: WASD or Arrow keys to move
 *
 * Loads 3D model from poly.pizza by jeremy
 */
export function Crab() {
  const groupRef = useRef<Group>(null);
  const keys = useKeyboard();
  const { updatePosition, updateRotation, updateAnimationState, joystickMovement } =
    useCrabContext();
  const {
    soundEnabled,
    volume,
    equippedAccessory,
    mugClickCount,
    lastActivityTime,
    updateActivity,
  } = useStore();

  // Load GLTF model
  const { scene, animations } = useGLTF('/models/crab.glb');

  // Animation states
  const [shouldYawn, setShouldYawn] = useState(false);
  const hasYawnedRef = useRef(false);
  const hasDancedRef = useRef(false);
  // Offset animé pour la levée des pinces (pour la fluidité)
  const clawOffsetRef = useRef(0);

  const mixerRef = useRef<AnimationMixer | null>(null);
  const blinkActionsRef = useRef<AnimationAction[]>([]);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blinkReady, setBlinkReady] = useState(false);

  // Animation de marche
  const walkActionRef = useRef<AnimationAction | null>(null);
  const isWalkingRef = useRef(false); // Track current walking state

  // Références aux pinces pour l'animation au contact du mur
  const leftClawRef = useRef<THREE.Object3D | null>(null);
  const rightClawRef = useRef<THREE.Object3D | null>(null);
  // Stocke la rotation.x d'origine pour offset
  const leftClawBaseRotX = useRef<number | null>(null);
  const rightClawBaseRotX = useRef<number | null>(null);

  // Référence à la tête pour les accessoires
  const headRef = useRef<THREE.Object3D | null>(null);
  const [head, setHead] = useState<THREE.Object3D | null>(null);

  // Initialisation du mixer et des actions blink pour chaque eyelid
  useEffect(() => {
    if (scene && animations && animations.length > 0) {
      mixerRef.current = new AnimationMixer(scene);

      // Cherche les quatre animations eyelid
      const eyelidNames = [
        'LeftEye_Eyelid_UpperAction',
        'LeftEye_Eyelid_LowerAction',
        'RightEye_Eyelid_UpperAction',
        'RightEye_Eyelid_LowerAction',
      ];
      const actions: AnimationAction[] = [];
      eyelidNames.forEach((name) => {
        const clip = animations.find((a) => a.name === name);
        if (clip && mixerRef.current) {
          const action = mixerRef.current.clipAction(clip);
          action.setLoop(LoopOnce, 1);
          action.clampWhenFinished = true;
          action.timeScale = 1.5;
          actions.push(action);
        }
      });
      blinkActionsRef.current = actions;

      // Animation de marche
      const walkClip = animations.find((a) => a.name === 'ArmatureAction');
      if (walkClip) {
        // Ajuster la durée
        const targetDuration = 14 / 24; // 0.583 secondes pour 24 FPS
        const scaleFactor = targetDuration / walkClip.duration;
        walkClip.tracks.forEach((track) => {
          track.times = track.times.map((t) => t * scaleFactor);
        });
        walkClip.duration = targetDuration;

        // if (walkClip.tracks) {
        //   // Filtre les tracks qui affectent l'orientation (quaternion) des pinces ET de leurs parents
        //   const filteredTracks = walkClip.tracks.filter((track) => {
        //     return !(
        //       track.name.includes('ClawL002.quaternion') ||
        //       track.name.includes('ClawR002.quaternion') ||
        //       track.name.includes('ClawL.quaternion') ||
        //       track.name.includes('ClawR.quaternion')
        //     );
        //   });
        //   // Crée un nouveau clip sans les tracks quaternion des pinces ni de leurs parents
        //   walkClip = walkClip.clone();
        //   walkClip.tracks = filteredTracks;
        // }

        if (mixerRef.current) {
          walkActionRef.current = mixerRef.current.clipAction(walkClip);
          walkActionRef.current.setLoop(LoopRepeat, Infinity);
          walkActionRef.current.timeScale = 0; // Commence à 0 pour transition fluide
          walkActionRef.current.clampWhenFinished = false;
          walkActionRef.current.play(); // Toujours jouer, mais avec timeScale = 0
        }
      }
    }

    // Activer les ombres sur tous les meshes du crabe
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Utiliser ClawL002 et ClawR002 pour l'animation (segments principaux)
    leftClawRef.current = scene.getObjectByName('ClawL002') || null;
    rightClawRef.current = scene.getObjectByName('ClawR002') || null;
    // Stocke la rotation.x d'origine après chargement
    if (leftClawRef.current) leftClawBaseRotX.current = leftClawRef.current.rotation.x;
    if (rightClawRef.current) rightClawBaseRotX.current = rightClawRef.current.rotation.x;
    headRef.current = scene.getObjectByName('MASTER') || null;
    setHead(headRef.current);

    // Nettoyage si la scène change
    return () => {
      // Dispose mixer and actions
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(mixerRef.current.getRoot());
      }
      mixerRef.current = null;
      blinkActionsRef.current = [];
      walkActionRef.current = null;
      leftClawRef.current = null;
      rightClawRef.current = null;
      headRef.current = null;
      setBlinkReady(false);
    };
  }, [scene, animations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup geometries and materials
      if (scene) {
        scene.traverse((child) => {
          if (child instanceof Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [scene]);

  // Synchronise blinkReady avec la présence des actions blink
  useEffect(() => {
    setBlinkReady(blinkActionsRef.current.length > 0);
  }, []);

  // Effet pour gérer le clignement à intervalle aléatoire (5-8s)
  useEffect(() => {
    if (!blinkReady || blinkActionsRef.current.length === 0) return;
    let isMounted = true;
    const triggerBlink = () => {
      if (!isMounted) return;
      blinkActionsRef.current.forEach((action) => {
        action.reset();
        action.play();
      });
      const next = 5000 + Math.random() * 3000;
      blinkTimeoutRef.current = setTimeout(triggerBlink, next);
    };
    blinkTimeoutRef.current = setTimeout(triggerBlink, 2000 + Math.random() * 2000);
    return () => {
      isMounted = false;
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, [blinkReady]);

  // Définition des obstacles fixes (AABB)
  const obstacles = useMemo(
    () => [
      // FrontWall
      new Box3(new Vector3(-6, 0, 3), new Vector3(6, 3, 4)),
      // BackWall
      new Box3(new Vector3(-6, 0, -5.5), new Vector3(6, 3, -4.5)),
      // LeftWall
      new Box3(new Vector3(-6.5, 0, -5), new Vector3(-5.5, 3, 5)),
      // RightWall
      new Box3(new Vector3(5.5, 0, -5), new Vector3(6.5, 3, 5)),
      // Table (bureau)
      new Box3(new Vector3(-1.8, 0, -4), new Vector3(1.8, 1, -2.3)),
      // Plante (coin droite de la pièce)
      new Box3(new Vector3(4.2, 0, -5), new Vector3(5, 1.5, -3)),
      // Lampe (coin gauche de la pièce)
      new Box3(new Vector3(-5, 0, -4), new Vector3(-4, 2, -3)),
    ],
    []
  );

  // Create controller instance (persists across renders)
  const controller = useMemo(() => {
    const safeStart = new Vector3(0, 0.5, 0);
    const ctrl = new CrabController(safeStart);
    ctrl.setObstacles(obstacles);
    return ctrl;
  }, [obstacles]);

  // Trigger dance when mug is clicked multiples of 3 times
  const shouldDance = useMemo(() => mugClickCount > 0 && mugClickCount % 3 === 0, [mugClickCount]);

  // Reset dance state when mug click count changes
  useEffect(() => {
    hasDancedRef.current = false;
  }, [mugClickCount]);

  // Animation hooks
  const playDance = useDanceAnimation(groupRef, shouldDance, 3.0);
  const playYawn = useYawnAnimation(groupRef, shouldYawn, 1.5);
  const isIdle = useIdleDetection(lastActivityTime, 60);

  // Footstep sound
  const footstepWood = useSound('/sounds/footsteps.wav', {
    volume: volume * 1,
    enabled: soundEnabled,
    loop: true,
  });

  // Track if footsteps are currently playing
  const footstepsPlayingRef = useRef(false);

  useFrame((_state, delta) => {
    // Limiter le delta pour éviter de grosses avancées d'animation
    // après inactivité (onglet en arrière-plan). Empêche les pinces
    // et autres animations de sauter brutalement.
    const MAX_DELTA = 0.05; // secondes (50ms)
    const clampedDelta = Math.min(delta, MAX_DELTA);

    // Get joystick input if available (mobile touch controls)
    const joystickDir = joystickMovement?.() ?? null;
    // Update controller with keyboard OR joystick input (use clamped delta)
    const crabState = controller.update(keys, clampedDelta, joystickDir);

    // Avance le mixer pour les animations GLTF (blink et marche)
    if (mixerRef.current) {
      mixerRef.current.update(clampedDelta);
    }

    // Animer les pinces au contact du mur (priorité sur l'animation GLTF)
    const wallProximity = controller.wallProximity;

    // Ajoute un offset dynamique à la rotation.x des pinces (par-dessus l'anim GLTF)
    if (leftClawRef.current?.rotation && rightClawRef.current?.rotation) {
      // Déclenchement retardé du lever de pattes (seuil augmenté)
      const targetOffset = wallProximity ? -wallProximity * 1.5 : 0;
      // Interpolation fluide de l'offset
      const lerpSpeed = 8.0 * clampedDelta;
      clawOffsetRef.current = THREE.MathUtils.lerp(clawOffsetRef.current, targetOffset, lerpSpeed);
      // Clamp l'offset pour éviter l'accumulation
      clawOffsetRef.current = THREE.MathUtils.clamp(clawOffsetRef.current, -1, 1);
      // Applique uniquement l'offset code
      leftClawRef.current.rotation.x = clawOffsetRef.current;
      rightClawRef.current.rotation.x = clawOffsetRef.current;
    }

    // ✨ ANIMATION DE MARCHE - Transition fluide
    if (walkActionRef.current) {
      const shouldWalk = crabState.animationState === 'walk';

      // Fixe timeScale pour éviter les sauts dus à la transition
      walkActionRef.current.timeScale = shouldWalk ? 1.2 : 0;

      // S'assure que l'animation est toujours en lecture
      if (!walkActionRef.current.isRunning()) {
        walkActionRef.current.play();
      }

      // Track l'état pour éviter les appels répétés
      isWalkingRef.current = shouldWalk;
    }

    // Update group position
    if (groupRef.current) {
      groupRef.current.position.copy(crabState.position);

      // Interpolation fluide de la rotation Y
      const currentY = groupRef.current.rotation.y;
      const targetY = crabState.rotation.y;

      // Lerp angle (gère wrap-around)
      let deltaY = targetY - currentY;
      while (deltaY > Math.PI) deltaY -= Math.PI * 2;
      while (deltaY < -Math.PI) deltaY += Math.PI * 2;

      const rotationLerpSpeed = Math.min(1, MOVEMENT.ROTATION_SPEED * clampedDelta);
      groupRef.current.rotation.y = currentY + deltaY * rotationLerpSpeed;
    }

    // Update context for other components
    updatePosition(crabState.position);
    updateRotation(crabState.rotation.y);

    // Map animation states to context expected values
    const contextAnimState = crabState.animationState === 'walk' ? 'walking' : 'idle';
    updateAnimationState(contextAnimState);

    // Update activity tracker when moving
    if (crabState.animationState === 'walk') {
      updateActivity();
    }

    // Play dance animation when triggered by mug clicks
    if (shouldDance && !hasDancedRef.current) {
      const danceComplete = playDance(clampedDelta);
      if (danceComplete) {
        hasDancedRef.current = true;
      }
    }

    // Check for idle yawn animation
    if (isIdle && !shouldYawn && !hasYawnedRef.current) {
      setShouldYawn(true);
      hasYawnedRef.current = true;
    } else if (!isIdle) {
      hasYawnedRef.current = false; // Reset when user becomes active
    }

    // Check for yawn animation completion
    if (shouldYawn) {
      const yawnComplete = playYawn(clampedDelta);
      if (yawnComplete) {
        setShouldYawn(false);
      }
    }

    // Play footstep sounds when moving - loop continuously during walk
    if (soundEnabled) {
      const isWalking = crabState.animationState === 'walk';
      if (isWalking && !footstepsPlayingRef.current) {
        footstepWood.play();
        footstepsPlayingRef.current = true;
      } else if (!isWalking && footstepsPlayingRef.current) {
        footstepWood.pause();
        footstepsPlayingRef.current = false;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Model from Blender - Crab */}
      <primitive
        object={scene}
        scale={1.2}
        rotation={[0, 0, 0]}
        position={[0, 0.5, 0]}
        castShadow
        receiveShadow
      />
      {/* Accessory (hat) if equipped */}
      {equippedAccessory && <Accessory type={equippedAccessory} head={head} />}
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/crab.glb');
