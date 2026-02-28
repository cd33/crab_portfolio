import { performanceMonitor } from '@utils/performance';
import { useEffect, useState } from 'react';

interface PerformanceData {
  fps: number;
  avgFps: number;
  status: 'good' | 'warning' | 'poor';
  qualitySettings: {
    shadows: boolean;
    shadowMapSize: number;
  };
}

/**
 * Hook to monitor performance and get real-time metrics
 * Updates every second
 */
export function usePerformanceMonitor(): PerformanceData {
  const [data, setData] = useState<PerformanceData>({
    fps: 60,
    avgFps: 60,
    status: 'good',
    qualitySettings: performanceMonitor.getQualitySettings(),
  });

  useEffect(() => {
    // Update performance monitor every frame
    const frameUpdate = () => {
      performanceMonitor.update();
      requestAnimationFrame(frameUpdate);
    };
    const animationId = requestAnimationFrame(frameUpdate);

    // Update component state every second
    const interval = setInterval(() => {
      setData({
        fps: performanceMonitor.getFPS(),
        avgFps: performanceMonitor.getAverageFPS(),
        status: performanceMonitor.getStatus(),
        qualitySettings: performanceMonitor.getQualitySettings(),
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(interval);
    };
  }, []);

  return data;
}
