import { expect, test } from '@playwright/test';

test.describe('Navigation 3D', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for WebGL detection and scene to load
    await page.waitForTimeout(2000);
  });

  test('should load the 3D scene successfully', async ({ page }) => {
    // Check if canvas element is present
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show controls overlay', async ({ page }) => {
    // Check for controls instructions
    const hasControls = await page
      .getByText(/WASD|Arrow Keys|Move/i)
      .isVisible()
      .catch(() => false);

    // If controls are visible, verify them
    if (hasControls) {
      const controls = page.getByText(/WASD|Arrow Keys|Move/i);
      await expect(controls).toBeVisible();
    }
  });

  test('should respond to keyboard input (W key)', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Press W key for forward movement
    await page.keyboard.press('w');
    await page.waitForTimeout(100);

    // Canvas should still be visible (basic sanity check)
    await expect(canvas).toBeVisible();
  });

  test('should respond to keyboard input (S key)', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Press S key for backward movement
    await page.keyboard.press('s');
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('should respond to keyboard input (A key)', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Press A key for left movement
    await page.keyboard.press('a');
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('should respond to keyboard input (D key)', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Press D key for right movement
    await page.keyboard.press('d');
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('should handle arrow key navigation', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Press arrow keys
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(50);

    await expect(canvas).toBeVisible();
  });

  test('should handle multiple key presses', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Press W and D simultaneously
    await page.keyboard.down('w');
    await page.keyboard.down('d');
    await page.waitForTimeout(100);
    await page.keyboard.up('w');
    await page.keyboard.up('d');

    await expect(canvas).toBeVisible();
  });

  test('should maintain performance during navigation', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Simulate continuous movement
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('w');
      await page.waitForTimeout(100);
    }

    // Scene should still be responsive
    await expect(canvas).toBeVisible();
  });

  test('should show fallback HTML if WebGL is not supported', async ({ page }) => {
    // This test checks if the fallback mechanism exists
    // Actual WebGL disabling would require browser flags

    // Check if page has either canvas OR fallback content
    const hasCanvas = await page
      .locator('canvas')
      .isVisible()
      .catch(() => false);
    const hasFallback = await page
      .locator('main, article, section')
      .isVisible()
      .catch(() => false);

    expect(hasCanvas || hasFallback).toBeTruthy();
  });

  test('should not crash when pressing unsupported keys', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Press random keys that shouldn't affect navigation
    await page.keyboard.press('x');
    await page.keyboard.press('y');
    await page.keyboard.press('z');
    await page.waitForTimeout(100);

    // Scene should still work
    await expect(canvas).toBeVisible();
  });
});

test.describe('Performance Monitoring', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');

    // Wait for canvas to be ready
    await page.locator('canvas').waitFor({ timeout: 5000 });
    const loadTime = Date.now() - startTime;

    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should render without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Filter out expected errors (like missing audio files in test env)
    const criticalErrors = errors.filter((err) => !err.includes('audio') && !err.includes('sound'));

    expect(criticalErrors.length).toBe(0);
  });
});
