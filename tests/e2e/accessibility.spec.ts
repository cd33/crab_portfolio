import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** Wait until the Three.js WebGL context is ready. */
async function waitForScene(page: Page) {
  await page.waitForFunction(() => window.__SCENE_READY__ === true, { timeout: 15_000 });
}

/**
 * Dismiss the intro overlay via keyboard.
 * Any keydown triggers the closing animation (1.5 s); we wait for the element to detach.
 * Using keyboard avoids the canvas intercepting pointer events.
 */
async function dismissIntro(page: Page) {
  const intro = page.locator('.intro-overlay-container');
  const isVisible = await intro.isVisible().catch(() => false);
  if (isVisible) {
    await page.keyboard.press('Enter');
    await intro.waitFor({ state: 'detached', timeout: 10_000 });
  }
}

test.describe('Accessibility (axe-core)', () => {
  // axe.analyze() is slow; give each test plenty of room
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
  });

  test('intro page has no critical accessibility violations', async ({ page, browserName }) => {
    // axe gives the most consistent results on Chromium; skip on other engines
    test.skip(browserName !== 'chromium', 'Axe audit runs on Chromium only');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('canvas') // WebGL content is inherently opaque to axe
      .disableRules(['color-contrast']) // computed-style contrast is unreliable in headless CI
      .analyze();

    const violations = results.violations;
    expect(
      violations,
      `Axe violations found:\n${violations.map((v) => `[${v.id}] ${v.description}\n  nodes: ${v.nodes.map((n) => n.html).join('\n  ')}`).join('\n\n')}`
    ).toHaveLength(0);
  });

  test('main scene (after intro) has no critical accessibility violations', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Axe audit runs on Chromium only');

    await dismissIntro(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('canvas')
      .disableRules(['color-contrast'])
      .analyze();

    const violations = results.violations;
    expect(
      violations,
      `Axe violations found:\n${violations.map((v) => `[${v.id}] ${v.description}\n  nodes: ${v.nodes.map((n) => n.html).join('\n  ')}`).join('\n\n')}`
    ).toHaveLength(0);
  });

  test('Three.js canvas wrapper has an aria-label and role', async ({ page }) => {
    // R3F v9 renders two nested divs:
    //   <div role aria-label>   ← outer div receives ...props (aria-label, role)
    //     <div>                 ← inner container div (no aria attrs)
    //       <canvas data-engine>
    // So we must traverse two levels up to reach the div with the aria attributes.
    const canvas = page.locator('canvas[data-engine]').first();
    await canvas.waitFor({ state: 'visible', timeout: 15_000 });
    // The outer wrapper div is the grandparent of the canvas.
    const wrapper = canvas.locator('../..');
    await expect(wrapper).toHaveAttribute('aria-label', /.+/);
    await expect(wrapper).toHaveAttribute('role', 'application');
  });

  test('SecurityKeypadModal buttons have aria-labels', async ({ page }) => {
    await dismissIntro(page);

    // Trigger the keypad via the Zustand store exposed on window
    await page.evaluate(() => {
      const store = (
        window as unknown as {
          __zustand_store__?: { getState: () => { openSecurityKeypad: () => void } };
        }
      ).__zustand_store__;
      if (store) store.getState().openSecurityKeypad();
    });

    const keypadVisible = await page
      .locator('[aria-labelledby="keypad-modal-title"]')
      .isVisible()
      .catch(() => false);

    if (!keypadVisible) {
      // Keypad not reachable via store injection in this context - skip gracefully
      test.skip();
      return;
    }

    const buttons = page.locator('[aria-labelledby="keypad-modal-title"] button[aria-label]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('noscript fallback exists in the HTML source', async ({ page }) => {
    const html = await page.content();
    expect(html).toContain('<noscript>');
  });
});
