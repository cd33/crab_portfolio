import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const threeCanvas = (page: Page) => page.locator('canvas[data-engine*="three.js"]');

async function waitForScene(page: Page) {
  await threeCanvas(page).waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(() => window.__SCENE_READY__ === true, { timeout: 15_000 });
}

async function dismissIntro(page: Page) {
  const intro = page.locator('.intro-overlay-container');
  const isVisible = await intro.isVisible().catch(() => false);
  if (isVisible) {
    await page.keyboard.press('Enter');
    await intro.waitFor({ state: 'detached', timeout: 15_000 });
  }
}

// ---------------------------------------------------------------------------
// Controls Panel
// ---------------------------------------------------------------------------

test.describe('Controls Panel', () => {
  // Each test gets a fresh browser context → localStorage is empty → controlsVisible = true

  test('should be visible after the intro is dismissed', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);

    // Controls panel has a dismiss button ("Compris !" in FR, "Got it" / "Understood" in EN)
    const dismissBtn = page.getByRole('button', { name: /Compris|Understood|Got it/i });
    await expect(dismissBtn).toBeVisible({ timeout: 3_000 });
  });

  test('should contain navigation key information', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);

    // Controls panel is visible - check heading (FR: "Contrôles", EN: "Controls")
    const heading = page.getByRole('heading', { name: /Contrôles|Controls/i });
    await expect(heading).toBeVisible({ timeout: 5_000 });

    // Should list movement keys: ZQSD (FR/AZERTY) or WASD (EN/QWERTY)
    // Use `.first()` to avoid strict-mode violation when the text appears in
    // both a <strong> and its parent <div>
    const movementKeys = page.getByText(/ZQSD|WASD/i).first();
    await expect(movementKeys).toBeVisible({ timeout: 5_000 });
  });

  test('should mention the interact key', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);

    // Interact key - "Touche E ou Espace" in FR or "E" somewhere
    const interactText = page.getByText(/Touche E|Key E/i);
    await expect(interactText).toBeVisible({ timeout: 3_000 });
  });

  test('should be dismissed when clicking the confirm button', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);

    const dismissBtn = page.getByRole('button', { name: /Compris|Understood|Got it/i });
    await expect(dismissBtn).toBeVisible({ timeout: 3_000 });

    await dismissBtn.click();
    await expect(dismissBtn).not.toBeVisible({ timeout: 3_000 });

    // Scene must still be accessible
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should persist dismissal in localStorage', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);

    const dismissBtn = page.getByRole('button', { name: /Compris|Understood|Got it/i });
    await dismissBtn.click();
    await expect(dismissBtn).not.toBeVisible({ timeout: 3_000 });

    // Navigate to '/' - localStorage persists within the same browser context.
    // page.goto() is more stable than page.reload() (avoids ERR_ABORTED flakiness).
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);

    await expect(dismissBtn).not.toBeVisible({ timeout: 2_000 });
  });

  test('should be restored via the Settings "Show controls" button', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);

    // Dismiss controls first
    const dismissBtn = page.getByRole('button', { name: /Compris|Understood|Got it/i });
    await dismissBtn.click();
    await expect(dismissBtn).not.toBeVisible({ timeout: 3_000 });

    // Open settings (Escape) → click "Show controls"
    await page.keyboard.press('Escape');
    const settingsDialog = page
      .locator('[role="dialog"][aria-modal="true"]')
      .filter({ hasNot: page.locator('[aria-labelledby]') });
    await settingsDialog.waitFor({ state: 'visible', timeout: 5_000 });

    await page.getByRole('button', { name: /Afficher les contrôles|Show controls/i }).click();

    // Controls panel should reappear
    await expect(dismissBtn).toBeVisible({ timeout: 3_000 });
  });
});
