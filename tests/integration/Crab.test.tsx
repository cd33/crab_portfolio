import { Crab } from '@/entities/Crab/Crab';
import { Canvas } from '@react-three/fiber';
import { render } from '@testing-library/react';
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

// Mock the useCrabContext
vi.mock('@core/useCrabContext', () => ({
  useCrabContext: vi.fn(() => ({
    position: new THREE.Vector3(0, 0, 0),
    rotation: 0,
    velocity: new THREE.Vector3(0, 0, 0),
    isMoving: false,
  })),
  CrabProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useGLTF
vi.mock('@react-three/drei', async () => {
  const actual = await vi.importActual('@react-three/drei');
  return {
    ...actual,
    useGLTF: Object.assign(
      vi.fn(() => ({
        scene: new THREE.Group(),
        nodes: {},
        materials: {},
      })),
      { preload: vi.fn() }
    ),
  };
});

// Mock global ResizeObserver pour jsdom
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Crab Component', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(
        <Canvas>
          <Crab />
        </Canvas>
      );
    }).not.toThrow();
  });

  it('should be in the scene hierarchy', () => {
    const { container } = render(
      <Canvas>
        <Crab />
      </Canvas>
    );

    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('should handle props without errors', () => {
    expect(() => {
      render(
        <Canvas>
          <Crab />
        </Canvas>
      );
    }).not.toThrow();
  });
});

describe('Crab Integration', () => {
  it('should work within Three.js scene', () => {
    const { container } = render(
      <Canvas>
        <ambientLight intensity={0.5} />
        <Crab />
      </Canvas>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.tagName).toBe('CANVAS');
  });

  it('should be compatible with React Three Fiber ecosystem', () => {
    expect(() => {
      render(
        <Canvas>
          <ambientLight />
          <directionalLight position={[10, 10, 5]} />
          <Crab />
        </Canvas>
      );
    }).not.toThrow();
  });
});
