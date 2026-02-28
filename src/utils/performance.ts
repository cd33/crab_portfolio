interface PerformanceMetrics {
  fps: number;
  frameTime: number;
}

interface QualitySettings {
  shadows: boolean;
  shadowMapSize: number;
}

/**
 * Performance Monitoring Utilities
 * Tracks FPS, polygon count, and other performance metrics
 * Auto-adjusts quality settings based on performance
 */
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private fpsHistory: number[] = [];
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
  };

  private qualitySettings: QualitySettings = {
    shadows: true,
    shadowMapSize: 1024,
  };

  private readonly FPS_HISTORY_SIZE = 60; // Track last 60 frames
  private readonly LOW_FPS_THRESHOLD = 30;
  private readonly GOOD_FPS_THRESHOLD = 55;
  private poorPerformanceFrames = 0;
  private readonly POOR_PERFORMANCE_LIMIT = 30; // 30 consecutive poor frames

  /**
   * Update FPS counter
   * Call this every frame
   */
  update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // Update FPS every second
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.metrics.fps = this.fps;
      this.metrics.frameTime = deltaTime / this.frameCount;

      // Track FPS history
      this.fpsHistory.push(this.fps);
      if (this.fpsHistory.length > this.FPS_HISTORY_SIZE) {
        this.fpsHistory.shift();
      }

      // Auto-adjust quality if needed
      this.autoAdjustQuality();

      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * Automatically adjust quality settings based on performance
   */
  private autoAdjustQuality(): void {
    const avgFps = this.getAverageFPS();

    // Track consecutive poor performance
    if (avgFps < this.LOW_FPS_THRESHOLD) {
      this.poorPerformanceFrames++;
    } else {
      this.poorPerformanceFrames = 0;
    }

    // Degrade quality if sustained poor performance
    if (this.poorPerformanceFrames >= this.POOR_PERFORMANCE_LIMIT) {
      if (this.qualitySettings.shadowMapSize > 512) {
        this.qualitySettings.shadowMapSize = 512;
        console.warn('Performance: Reduced shadow quality to 512');
      } else if (this.qualitySettings.shadows) {
        this.qualitySettings.shadows = false;
        console.warn('Performance: Disabled shadows');
      }
      this.poorPerformanceFrames = 0;
    }

    // Restore quality if performance is good
    if (avgFps > this.GOOD_FPS_THRESHOLD && this.poorPerformanceFrames === 0) {
      if (!this.qualitySettings.shadows) {
        this.qualitySettings.shadows = true;
        this.qualitySettings.shadowMapSize = 1024;
        console.log('Performance: Restored shadow quality');
      }
    }
  }

  /**
   * Get average FPS from history
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return this.fps;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get quality settings
   */
  getQualitySettings(): QualitySettings {
    return { ...this.qualitySettings };
  }

  /**
   * Get performance status
   */
  getStatus(): 'good' | 'warning' | 'poor' {
    if (this.fps >= 60) return 'good';
    if (this.fps >= 30) return 'warning';
    return 'poor';
  }

  /**
   * Force quality settings (for manual control)
   */
  setQualitySettings(settings: Partial<QualitySettings>): void {
    this.qualitySettings = { ...this.qualitySettings, ...settings };
  }

  /**
   * Reset to default quality
   */
  resetQuality(): void {
    this.qualitySettings = {
      shadows: true,
      shadowMapSize: 1024,
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
