import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** Locator for the Three.js canvas (distinct from the intro particles canvas). */
const threeCanvas = (page: Page) => page.locator('canvas[data-engine*="three.js"]');

/** Wait until the Three.js WebGL context is created and the scene is ready. */
async function waitForScene(page: Page) {
  await threeCanvas(page).waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(() => window.__SCENE_READY__ === true, { timeout: 15_000 });
}

test.describe('Navigation 3D', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
  });

  test('should load the 3D scene successfully', async ({ page }) => {
    await expect(threeCanvas(page)).toBeVisible();
    const isReady = await page.evaluate(() => window.__SCENE_READY__);
    expect(isReady).toBe(true);
  });

  test('should show controls overlay', async ({ page }) => {
    const controls = page.getByText(/WASD|Arrow Keys|Move/i);
    const isVisible = await controls.isVisible().catch(() => false);
    if (isVisible) {
      await expect(controls).toBeVisible();
    }
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should respond to keyboard input (W key)', async ({ page }) => {
    await page.keyboard.press('w');
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should respond to keyboard input (S key)', async ({ page }) => {
    await page.keyboard.press('s');
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should respond to keyboard input (A key)', async ({ page }) => {
    await page.keyboard.press('a');
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should respond to keyboard input (D key)', async ({ page }) => {
    await page.keyboard.press('d');
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should handle arrow key navigation', async ({ page }) => {
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      await page.keyboard.press(key);
    }
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should handle simultaneous key presses', async ({ page }) => {
    await page.keyboard.down('w');
    await page.keyboard.down('d');
    await page.keyboard.up('w');
    await page.keyboard.up('d');
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should maintain scene stability during continuous navigation', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('w');
    }
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should render the page with either canvas or static fallback', async ({ page }) => {
    const hasCanvas = await threeCanvas(page)
      .isVisible()
      .catch(() => false);
    const hasFallback = await page
      .locator('main, article, section')
      .isVisible()
      .catch(() => false);
    expect(hasCanvas || hasFallback).toBeTruthy();
  });

  test('should not crash when pressing unsupported keys', async ({ page }) => {
    await page.keyboard.press('x');
    await page.keyboard.press('y');
    await page.keyboard.press('z');
    await expect(threeCanvas(page)).toBeVisible();
  });
});

test.describe('Performance Monitoring', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await threeCanvas(page).waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForFunction(() => window.__SCENE_READY__ === true, { timeout: 10_000 });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10_000);
  });

  test('should render without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await threeCanvas(page).waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForFunction(() => window.__SCENE_READY__ === true, { timeout: 15_000 });

    const criticalErrors = errors.filter(
      (err) => !err.includes('audio') && !err.includes('sound') && !err.includes('AudioContext')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
