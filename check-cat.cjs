const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://ftx.dev.ftxcommerce.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Extract all category links from page
    const catLinks = await page.locator('a[href*="/category/"]').evaluateAll(els =>
      els.map(e => ({ href: e.getAttribute('href'), text: e.textContent?.trim() }))
    );
    console.log('Category links found on homepage:', JSON.stringify(catLinks.slice(0, 10), null, 2));

    for (const slug of ['accessories-60', 'apparel-01', 'cigarettes', 'aj-product-category']) {
      try {
        await page.goto(`https://ftx.dev.ftxcommerce.com/category/${slug}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        const url = page.url();
        const count = await page.locator('.product-items--card:visible, .product-card:visible').count();
        const addBtns = await page.locator('button:has-text("Add to Cart"), .add-cart:visible').count();
        console.log(`Slug: ${slug} -> Final URL: ${url} | Product cards: ${count} | AddToCart btns: ${addBtns}`);
      } catch (e) {
        console.log(`Slug ${slug} error:`, e.message);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
