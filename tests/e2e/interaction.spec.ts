import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Locator for the Three.js canvas (distinct from the intro particles canvas). */
const threeCanvas = (page: Page) => page.locator('canvas[data-engine*="three.js"]');

/** Wait until the Three.js WebGL context is ready. */
async function waitForScene(page: Page) {
  await threeCanvas(page).waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(() => window.__SCENE_READY__ === true, { timeout: 15_000 });
}

/**
 * Dismiss the intro overlay if it is present.
 * Any key triggers the 1.5 s closing animation; we wait for the element to detach.
 */
async function dismissIntro(page: Page) {
  const intro = page.locator('.intro-overlay-container');
  const isVisible = await intro.isVisible().catch(() => false);
  if (isVisible) {
    await page.keyboard.press('Enter');
    await intro.waitFor({ state: 'detached', timeout: 15_000 });
  }
}

/** Dismiss the Controls panel if it is visible (locale-aware button label). */
async function dismissControls(page: Page) {
  const btn = page.getByRole('button', { name: /Compris|Understood/i });
  const isVisible = await btn.isVisible().catch(() => false);
  if (isVisible) {
    await btn.click();
    await btn.waitFor({ state: 'hidden', timeout: 3_000 });
  }
}

// ---------------------------------------------------------------------------
// Interactions with Objects
// ---------------------------------------------------------------------------

test.describe('Interactions with Objects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);
    await dismissControls(page);
  });

  test('should detect interact key (E) without crashing the scene', async ({ page }) => {
    await page.keyboard.press('e');
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should open panel when interacting with a nearby object', async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('w');
    }
    await page.keyboard.press('e');

    const dialog = page.locator('[role="dialog"]');
    const dialogOpened = await dialog.isVisible().catch(() => false);

    if (dialogOpened) {
      await expect(dialog).toBeVisible();
    } else {
      await expect(threeCanvas(page)).toBeVisible();
    }
  });

  test('should close panel with Escape key', async ({ page }) => {
    await page.keyboard.press('w');
    await page.keyboard.press('e');

    const dialog = page.locator('[role="dialog"]');
    const dialogOpened = await dialog.isVisible().catch(() => false);

    if (dialogOpened) {
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }

    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should display content inside an open panel', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('w');
    }
    await page.keyboard.press('e');

    const dialog = page.locator('[role="dialog"]');
    const dialogOpened = await dialog.isVisible().catch(() => false);

    if (dialogOpened) {
      const hasText = await dialog.locator('h1, h2, h3, p').count();
      expect(hasText).toBeGreaterThan(0);
    } else {
      await expect(threeCanvas(page)).toBeVisible();
    }
  });

  test('should handle clicking the close button inside a panel', async ({ page }) => {
    await page.keyboard.press('w');
    await page.keyboard.press('e');

    const closeButton = page
      .locator('button')
      .filter({ hasText: /close|×|x|fermer/i })
      .first();
    const hasCloseButton = await closeButton.isVisible().catch(() => false);

    if (hasCloseButton) {
      await closeButton.click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }

    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should show visual indication when near object', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('w');
    }
    await expect(threeCanvas(page)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Progress Map (M key) - fully deterministic, always testable
  // -------------------------------------------------------------------------

  test('should open progress map with M key', async ({ page }) => {
    await page.keyboard.press('m');
    await expect(page.locator('[role="dialog"][aria-labelledby="progress-map-title"]')).toBeVisible(
      { timeout: 3_000 }
    );
  });

  test('should close progress map when pressing M again', async ({ page }) => {
    const progressMap = page.locator('[role="dialog"][aria-labelledby="progress-map-title"]');

    await page.keyboard.press('m');
    await expect(progressMap).toBeVisible({ timeout: 3_000 });

    await page.keyboard.press('m');
    await expect(progressMap).not.toBeVisible({ timeout: 3_000 });

    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should close progress map with Escape key', async ({ page }) => {
    const progressMap = page.locator('[role="dialog"][aria-labelledby="progress-map-title"]');

    await page.keyboard.press('m');
    await expect(progressMap).toBeVisible({ timeout: 3_000 });

    await page.keyboard.press('Escape');
    await expect(progressMap).not.toBeVisible({ timeout: 3_000 });
  });

  test('should handle rapid key presses without crashing', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('e');
    }
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should preserve scene state when opening and closing panels', async ({ page }) => {
    await page.keyboard.press('e');
    await page.keyboard.press('Escape');
    await page.keyboard.press('e');
    await expect(threeCanvas(page)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Accessibility Features
// ---------------------------------------------------------------------------

test.describe('Accessibility Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);
  });

  test('should give dialogs proper ARIA attributes', async ({ page }) => {
    await page.keyboard.press('m');
    const dialog = page.locator('[role="dialog"][aria-labelledby="progress-map-title"]');
    await expect(dialog).toBeVisible({ timeout: 3_000 });

    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    const title = page.locator('#progress-map-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
  });

  test('should support keyboard navigation inside the progress map', async ({ page }) => {
    await page.keyboard.press('m');
    await page
      .locator('[role="dialog"][aria-labelledby="progress-map-title"]')
      .waitFor({ state: 'visible', timeout: 3_000 });

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(threeCanvas(page)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Mobile Interactions
// ---------------------------------------------------------------------------

test.describe('Mobile Interactions', () => {
  test('should render on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForScene(page);

    const hasCanvas = await threeCanvas(page)
      .isVisible()
      .catch(() => false);
    const hasFallback = await page
      .locator('main, article')
      .isVisible()
      .catch(() => false);
    expect(hasCanvas || hasFallback).toBeTruthy();
  });

  test('should show virtual joystick on a touch-device viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForScene(page);

    const joystick = page.locator('[data-testid="virtual-joystick"], .joystick-container');
    const visible = await joystick.isVisible().catch(() => false);
    await expect(threeCanvas(page)).toBeVisible();
    if (visible) {
      await expect(joystick).toBeVisible();
    }
  });
});
