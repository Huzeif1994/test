# 🛡️ Quasar & Vue SPA UI Resilience Guidelines

## Common Intercept Scenarios & Validated Solutions

### 1. Quasar Skeleton Placeholders
* **Symptom:** Playwright attempts to click a card or button while the parent container has a `.q-skeleton` placeholder. Playwright receives an element-not-visible or detached error.
* **Fix:** Always invoke:
  ```typescript
  await page.locator('.q-skeleton').first().waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
  ```

### 2. Dialog and Drawer Action Overlays
* **Symptom:** Buttons at the bottom of drawers (`q-drawer`) or modals (`q-dialog`) are positioned over fixed footers or partially occluded by sticky headers.
* **Fix:** Combine scrolling into view with `{ force: true }`:
  ```typescript
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click({ force: true });
  ```

### 3. Clear and Fill Masked Inputs
* **Symptom:** Using `.fill('new-value')` on inputs formatted with Quasar masks (like phone numbers, postal codes, barcodes) occasionally leaves trailing characters or appends to old text.
* **Fix:** Always perform programmatic selection before typing:
  ```typescript
  await input.click();
  await input.press('Control+A');
  await input.press('Backspace');
  await input.fill(targetValue);
  ```

### 4. Headless Viewport Sizing
* **Symptom:** Quasar collapses side menus into hamburger drawers when viewport width drops below 1280px.
* **Fix:** CI launch arguments must explicitly include:
  ```typescript
  viewport: { width: 1366, height: 768 }
  ```

