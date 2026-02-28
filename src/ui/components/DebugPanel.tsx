import { useCrabContext } from '@core/useCrabContext';
import { usePerformanceMonitor } from '@hooks/usePerformanceMonitor';
import { SCENE_BOUNDS } from '@utils/constants';

/**
 * DebugPanel Component
 * Displays debug information about crab position, scene state, and performance metrics
 * Only shown in development mode
 */
export function DebugPanel() {
  const { position, rotation, animationState } = useCrabContext();
  const performance = usePerformanceMonitor();

  if (!import.meta.env.DEV) return null;

  // Color-code FPS
  const fpsColor =
    performance.status === 'good'
      ? '#00ff00'
      : performance.status === 'warning'
        ? '#ffaa00'
        : '#ff0000';

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#00ff00',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        borderRadius: '6px',
        zIndex: 1000,
        minWidth: '250px',
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffff00' }}>🦀 Debug Info</h3>

      {/* Performance Section */}
      <div
        style={{ marginBottom: '0.5rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}
      >
        <strong>Performance:</strong>
        <div style={{ paddingLeft: '1rem' }}>
          <span style={{ color: fpsColor }}>
            FPS: {performance.fps} (avg: {Math.round(performance.avgFps)})
          </span>
          <br />
          Status: <span style={{ color: fpsColor }}>{performance.status.toUpperCase()}</span>
          <br />
          Shadows: {performance.qualitySettings.shadows ? 'ON' : 'OFF'} (
          {performance.qualitySettings.shadowMapSize}px)
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <strong>Position:</strong>
        <div style={{ paddingLeft: '1rem' }}>
          X: {position.x.toFixed(2)} (bounds: {SCENE_BOUNDS.MIN_X} to {SCENE_BOUNDS.MAX_X})
          <br />
          Y: {position.y.toFixed(2)}
          <br />
          Z: {position.z.toFixed(2)} (bounds: {SCENE_BOUNDS.MIN_Z} to {SCENE_BOUNDS.MAX_Z})
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <strong>Rotation:</strong> {((rotation * 180) / Math.PI).toFixed(0)}°
      </div>

      <div>
        <strong>Animation:</strong> {animationState}
      </div>
    </div>
  );
}
