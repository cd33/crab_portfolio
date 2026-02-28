/**
 * TypeScript Interfaces - Portfolio Interactif 3D avec Crabe
 * Auto-generated from data-model.md
 * Date: 2025-11-29
 */

import { Euler, Vector3 } from 'three';

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Base pour tous les objets interactifs
 */
export interface InteractableObject {
  id: string;
  type: InteractableType;
  position: Vector3;
  rotation: Euler;
  interactionRadius: number; // default: 2.0
  isDiscovered?: boolean;
  glowIntensity?: number; // 0-1
  content: InfoContent | null;

  // Event handlers (implémentés par le composant)
  onHover?: () => void;
  onLeave?: () => void;
  onInteract?: () => void;
}

type InteractableType = 'computer' | 'poster' | 'book' | 'plant' | 'mug';

/**
 * Contenu informationnel
 */
export interface InfoContent {
  id?: string;
  title: string;
  description?: string;
  type?: 'image';
}
