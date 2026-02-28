import { performanceMonitor } from '@/utils/performance';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset the monitor between tests
    vi.clearAllMocks();
  });

  it('should initialize with 60 FPS', () => {
    const fps = performanceMonitor.getFPS();
    expect(fps).toBe(60);
  });

  it('should return good performance status initially', () => {
    const status = performanceMonitor.getStatus();
    expect(status).toBe('good');
  });

  it('should return all metrics', () => {
    const metrics = performanceMonitor.getMetrics();

    expect(metrics).toHaveProperty('fps');
    expect(metrics).toHaveProperty('frameTime');
  });

  it('should have valid initial metrics', () => {
    const metrics = performanceMonitor.getMetrics();

    expect(typeof metrics.fps).toBe('number');
    expect(typeof metrics.frameTime).toBe('number');
    expect(metrics.fps).toBeGreaterThanOrEqual(0);
  });

  it('should allow update calls without errors', () => {
    expect(() => {
      performanceMonitor.update();
    }).not.toThrow();
  });

  it('should maintain consistent metrics object structure', () => {
    const metrics1 = performanceMonitor.getMetrics();
    performanceMonitor.update();
    const metrics2 = performanceMonitor.getMetrics();

    expect(Object.keys(metrics1)).toEqual(Object.keys(metrics2));
  });

  it('should not mutate returned metrics', () => {
    const metrics = performanceMonitor.getMetrics();
    const originalFps = metrics.fps;

    metrics.fps = 999;

    const newMetrics = performanceMonitor.getMetrics();
    expect(newMetrics.fps).toBe(originalFps);
  });

  it('should handle multiple update calls', () => {
    expect(() => {
      for (let i = 0; i < 100; i++) {
        performanceMonitor.update();
      }
    }).not.toThrow();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.fps).toBeGreaterThanOrEqual(0);
  });

  it('should provide status based on FPS thresholds', () => {
    const status = performanceMonitor.getStatus();
    expect(['good', 'warning', 'poor']).toContain(status);
  });
});
