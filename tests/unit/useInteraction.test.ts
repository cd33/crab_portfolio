import { useInteraction } from '@/interactions/useInteraction';
import type { InteractableObject } from '@/types';
import { renderHook } from '@testing-library/react';
import { Euler, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';

// Shared mutable position - mirrors the production pattern (Vector3 mutated in-place)
const mockPosition = new Vector3(0, 0, 0);

// Mock the useCrabContext hook
vi.mock('@core/useCrabContext', () => ({
  useCrabContext: vi.fn(() => ({
    position: mockPosition,
  })),
}));

// Mock useFrame to execute the callback synchronously once per renderHook call,
// so tests run without a Canvas context.
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn((cb: (state: unknown, delta: number) => void) => {
    // Advance frameCounter past the throttle (call 6 times so frameCounter % 6 === 0 on the 6th)
    for (let i = 0; i < 6; i++) cb({}, 0.016);
  }),
}));

describe('useInteraction', () => {
  it('should return no interactions when no objects are nearby', () => {
    const objects: InteractableObject[] = [
      {
        id: 'test-1',
        type: 'computer',
        position: new Vector3(10, 0, 0), // Far away
        rotation: new Euler(0, 0, 0),
        interactionRadius: 2,
        content: { title: 'test-content' },
      },
    ];

    const { result } = renderHook(() => useInteraction(objects));

    expect(result.current.canInteract).toBe(false);
    expect(result.current.closestObject).toBe(null);
    expect(result.current.nearbyObjects).toHaveLength(0);
  });

  it('should detect nearby objects within interaction radius', () => {
    const objects: InteractableObject[] = [
      {
        id: 'test-1',
        type: 'computer',
        position: new Vector3(1, 0, 0), // Within radius
        rotation: new Euler(0, 0, 0),
        interactionRadius: 2,
        content: { title: 'test-content' },
      },
    ];

    const { result } = renderHook(() => useInteraction(objects));

    expect(result.current.canInteract).toBe(true);
    expect(result.current.closestObject).not.toBe(null);
    expect(result.current.closestObject?.id).toBe('test-1');
    expect(result.current.nearbyObjects).toHaveLength(1);
  });

  it('should return the closest object when multiple are in range', () => {
    const objects: InteractableObject[] = [
      {
        id: 'far',
        type: 'poster',
        position: new Vector3(1.5, 0, 0),
        rotation: new Euler(0, 0, 0),
        interactionRadius: 2,
        content: { title: 'far-content' },
      },
      {
        id: 'close',
        type: 'book',
        position: new Vector3(0.5, 0, 0),
        rotation: new Euler(0, 0, 0),
        interactionRadius: 2,
        content: { title: 'close-content' },
      },
    ];

    const { result } = renderHook(() => useInteraction(objects));

    expect(result.current.closestObject?.id).toBe('close');
    expect(result.current.nearbyObjects).toHaveLength(2);
  });

  it('should calculate distance correctly', () => {
    const objects: InteractableObject[] = [
      {
        id: 'test-1',
        type: 'computer',
        position: new Vector3(3, 0, 4), // Distance should be 5 (3-4-5 triangle)
        rotation: new Euler(0, 0, 0),
        interactionRadius: 6,
        content: { title: 'test-content' },
      },
    ];

    const { result } = renderHook(() => useInteraction(objects));

    expect(result.current.canInteract).toBe(true);
    expect(result.current.distanceToClosest).toBe(5);
  });

  it('should return Infinity as distance when no objects are nearby', () => {
    const objects: InteractableObject[] = [
      {
        id: 'test-1',
        type: 'computer',
        position: new Vector3(100, 0, 0),
        rotation: new Euler(0, 0, 0),
        interactionRadius: 2,
        content: { title: 'test-content' },
      },
    ];

    const { result } = renderHook(() => useInteraction(objects));

    expect(result.current.distanceToClosest).toBe(Infinity);
  });

  it('should handle empty object array', () => {
    const objects: InteractableObject[] = [];

    const { result } = renderHook(() => useInteraction(objects));

    expect(result.current.canInteract).toBe(false);
    expect(result.current.closestObject).toBe(null);
    expect(result.current.nearbyObjects).toHaveLength(0);
    expect(result.current.distanceToClosest).toBe(Infinity);
  });

  it('should respect different interaction radii', () => {
    const objects: InteractableObject[] = [
      {
        id: 'small-radius',
        type: 'mug',
        position: new Vector3(1.5, 0, 0),
        rotation: new Euler(0, 0, 0),
        interactionRadius: 1, // Too small
        content: { title: 'mug-content' },
      },
      {
        id: 'large-radius',
        type: 'plant',
        position: new Vector3(1.5, 0, 0),
        rotation: new Euler(0, 0, 0),
        interactionRadius: 3, // Large enough
        content: { title: 'plant-content' },
      },
    ];

    const { result } = renderHook(() => useInteraction(objects));

    expect(result.current.nearbyObjects).toHaveLength(1);
    expect(result.current.closestObject?.id).toBe('large-radius');
  });
});

describe('useInteraction - correction bug Vector3 muté', () => {
  it('recalcule correctement quand la position du crabe change (mutation in-place)', () => {
    // Réinitialiser la position partagée
    mockPosition.set(10, 0, 0); // Loin de l'objet

    const objects: InteractableObject[] = [
      {
        id: 'nearby',
        type: 'computer',
        position: new Vector3(0, 0, 0),
        rotation: new Euler(0, 0, 0),
        interactionRadius: 2,
        content: { title: 'test-content' },
      },
    ];

    // Premier rendu : crabe loin → pas d'interaction
    const { result, rerender } = renderHook(() => useInteraction(objects));
    expect(result.current.canInteract).toBe(false);

    // Muter la position (comme CrabController le fait) + forcer un re-render
    mockPosition.set(0.5, 0, 0); // Proche de l'objet
    rerender();

    // Après re-render, useFrame re-lit la position mutée → interaction détectée
    expect(result.current.canInteract).toBe(true);
    expect(result.current.closestObject?.id).toBe('nearby');
  });
});
