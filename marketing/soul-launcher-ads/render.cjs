// Renders every ad to a PNG at its exact size: `node render.cjs` (needs the playwright package).
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ADS = [
  ['ad-1-chores.html', 'soul-launcher-ad-1-chores-1080x1080.png'],
  ['ad-2-sync.html', 'soul-launcher-ad-2-sync-1080x1350.png'],
  ['ad-3-install.html', 'soul-launcher-ad-3-install-1080x1920.png'],
];

(async () => {
  const only = process.argv.slice(2);
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (err) => console.error('page error:', err.message));
  for (const [html, png] of ADS) {
    if (only.length && !only.some((o) => html.includes(o))) continue;
    if (!fs.existsSync(path.join(__dirname, html))) continue;
    await page.goto('file://' + path.join(__dirname, html));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.locator('.ad').screenshot({ path: path.join(outDir, png) });
    console.log('wrote out/' + png);
  }
  await browser.close();
})();
