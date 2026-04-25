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

/** Dismiss the Controls panel if it is visible (text depends on current locale). */
async function dismissControls(page: Page) {
  const btn = page.getByRole('button', { name: /Compris|Understood/i });
  const isVisible = await btn.isVisible().catch(() => false);
  if (isVisible) {
    await btn.click();
    await btn.waitFor({ state: 'hidden', timeout: 3_000 });
  }
}

/**
 * Open the Settings panel with the Escape key.
 * Settings is the only dialog that uses aria-label (not aria-labelledby).
 */
async function openSettings(page: Page) {
  await page.keyboard.press('Escape');
  // Settings dialog identified by its aria-label attribute (no aria-labelledby)
  await page
    .locator('[role="dialog"][aria-modal="true"]')
    .filter({ hasNot: page.locator('[aria-labelledby]') })
    .waitFor({ state: 'visible', timeout: 5_000 });
}

/** The Settings dialog locator (distinguished from other modals). */
const settingsDialog = (page: Page) =>
  page
    .locator('[role="dialog"][aria-modal="true"]')
    .filter({ hasNot: page.locator('[aria-labelledby]') });

// ---------------------------------------------------------------------------
// Settings Panel
// ---------------------------------------------------------------------------

test.describe('Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);
    await dismissControls(page);
  });

  test('should open with Escape key', async ({ page }) => {
    await openSettings(page);
    await expect(settingsDialog(page)).toBeVisible();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await openSettings(page);
    const dialog = settingsDialog(page);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Heading text must be non-empty (FR: "Paramètres", EN: "Settings")
    const heading = dialog.locator('h3').first();
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('should close with Escape key', async ({ page }) => {
    await openSettings(page);
    await expect(settingsDialog(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(settingsDialog(page)).not.toBeVisible({ timeout: 3_000 });
    await expect(threeCanvas(page)).toBeVisible();
  });

  test('should close by clicking the backdrop', async ({ page }) => {
    await openSettings(page);
    await expect(settingsDialog(page)).toBeVisible();

    // Click the left area of the backdrop (x=200 avoids the Stats FPS panel at 0-80px;
    // y=360 is vertically centred but outside the 320px-wide inner panel at x≈480-800)
    await settingsDialog(page).click({ position: { x: 200, y: 360 } });
    await expect(settingsDialog(page)).not.toBeVisible({ timeout: 3_000 });
  });

  test('should have a sound-effects toggle button', async ({ page }) => {
    await openSettings(page);
    const soundBtn = page.getByRole('button', {
      name: /Disable sound effects|Enable sound effects/i,
    });
    await expect(soundBtn).toBeVisible();
    // Click should not crash
    await soundBtn.click();
    await expect(settingsDialog(page)).toBeVisible();
  });

  test('should have an ambient-music toggle button', async ({ page }) => {
    await openSettings(page);
    const musicBtn = page.getByRole('button', {
      name: /Disable ambient music|Enable ambient music/i,
    });
    await expect(musicBtn).toBeVisible();
    await musicBtn.click();
    await expect(settingsDialog(page)).toBeVisible();
  });

  test('should switch language to English', async ({ page }) => {
    await openSettings(page);

    // Default locale is French → heading "Paramètres"
    await expect(settingsDialog(page).locator('h3').first()).toHaveText(/Paramètres/i);

    // Switch to English
    await page.getByRole('button', { name: /English/i }).click();

    // Heading must update to "Settings"
    await expect(settingsDialog(page).locator('h3').first()).toHaveText(/Settings/i, {
      timeout: 3_000,
    });
  });

  test('should switch language back to French', async ({ page }) => {
    await openSettings(page);

    // Switch to English first
    await page.getByRole('button', { name: /English/i }).click();
    await expect(settingsDialog(page).locator('h3').first()).toHaveText(/Settings/i, {
      timeout: 3_000,
    });

    // Switch back to French
    await page.getByRole('button', { name: /Français/i }).click();
    await expect(settingsDialog(page).locator('h3').first()).toHaveText(/Param/i, {
      timeout: 3_000,
    });
  });

  test('should have keyboard layout buttons (AZERTY / QWERTY)', async ({ page }) => {
    await openSettings(page);
    const azerty = page.getByRole('button', { name: /AZERTY/i });
    const qwerty = page.getByRole('button', { name: /QWERTY/i });
    await expect(azerty).toBeVisible();
    await expect(qwerty).toBeVisible();

    // Toggle to QWERTY should not crash
    await qwerty.click();
    await expect(settingsDialog(page)).toBeVisible();
  });

  test('should show controls panel again via the "Show controls" button', async ({ page }) => {
    await openSettings(page);

    // Click "Show controls" / "Afficher les contrôles" button inside settings
    const showControlsBtn = page.getByRole('button', {
      name: /Afficher les contrôles|Show controls/i,
    });
    await expect(showControlsBtn).toBeVisible();
    await showControlsBtn.click();

    // Settings closes and the controls panel becomes visible
    await expect(settingsDialog(page)).not.toBeVisible({ timeout: 3_000 });
    const controlsPanel = page.getByRole('button', { name: /Compris|Understood/i });
    await expect(controlsPanel).toBeVisible({ timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// Language persistence
// ---------------------------------------------------------------------------

test.describe('Language persistence', () => {
  test('should persist English language choice across navigation', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await dismissIntro(page);
    await dismissControls(page);

    // Open settings and switch to English
    await openSettings(page);
    await page.getByRole('button', { name: /English/i }).click();
    await expect(settingsDialog(page).locator('h3').first()).toHaveText(/Settings/i, {
      timeout: 3_000,
    });
    await page.keyboard.press('Escape');

    // Reload page - locale is stored in localStorage
    await page.reload();
    await waitForScene(page);
    await dismissIntro(page);
    await dismissControls(page);
    await openSettings(page);

    // Heading should still be "Settings" (English)
    await expect(settingsDialog(page).locator('h3').first()).toHaveText(/Settings/i, {
      timeout: 3_000,
    });
  });
});
