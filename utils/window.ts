import { Page } from '@playwright/test';

/**
 * Automatically maximize the browser window to fit the user's native screen resolution in headed mode.
 * Uses Chrome DevTools Protocol (CDP) to natively trigger the Windows OS Maximize button.
 */
export async function maximizeWindow(page: Page): Promise<void> {
  try {
    const session = await page.context().newCDPSession(page);
    const { windowId } = await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds', {
      windowId,
      bounds: { windowState: 'maximized' },
    });
    await session.detach();
  } catch (err) {
    // Graceful fallback if CDP is not available
  }
}

