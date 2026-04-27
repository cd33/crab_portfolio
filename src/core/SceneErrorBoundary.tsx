import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Fallback rendered when an error is caught. Must be valid inside a Three.js Canvas. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary for Three.js scene components.
 *
 * Wrap around individual lazy/Suspense components inside a <Canvas>.
 * - Renders the `fallback` prop (a 3D mesh) when a child throws.
 * - Logs the error in development.
 *
 * Usage:
 *   <SceneErrorBoundary fallback={<ModelFallbackBox />}>
 *     <Suspense fallback={null}>
 *       <Crab />
 *     </Suspense>
 *   </SceneErrorBoundary>
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[SceneErrorBoundary] 3D component failed to load:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

/**
 * Minimal 3D fallback rendered in place of a failed model.
 * Shows a red wireframe box so developers can spot the failure visually.
 */
export function ModelFallbackBox({
  position = [0, 0.5, 0] as [number, number, number],
  scale = [1, 1, 1] as [number, number, number],
}) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6b6b" wireframe />
    </mesh>
  );
}
