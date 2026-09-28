import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const runtime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__profile.cjs'));
const { chromium } = runtime('playwright');
const output = resolve('docs/performance-2026-09-29');
mkdirSync(output, { recursive: true });
let browser;
const results = [];
try {
  for (const variant of ['arial-auto', 'current', 'arial-auto-repeat', 'current-repeat']) {
    browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, timeout: 60000 });
    const context = await browser.newContext({ viewport: { width: 412, height: 823 }, serviceWorkers: 'block' });
    // Thử riêng CSS để tìm nguyên nhân; các số này không dùng làm điểm Lighthouse nghiệm thu.
    await context.route('http://127.0.0.1:3001/', async route => {
      const response = await route.fetch();
      let html = await response.text();
      if (variant.includes('arial')) {
        html = html.replace(/--font-sans:[^;]+;/, '--font-sans:Arial,sans-serif;').replace(/--font-display:[^;]+;/, '--font-display:Arial,sans-serif;');
      }
      if (variant.includes('auto')) html = html.replace('text-rendering:optimizeLegibility', 'text-rendering:auto');
      await route.fulfill({ response, body: html });
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.goto('http://127.0.0.1:3001/', { waitUntil: 'load', timeout: 60000 });
    await page.getByRole('alertdialog', { name: 'Thông báo cookie' }).waitFor({ timeout: 30000 });
    const { metrics } = await cdp.send('Performance.getMetrics');
    const row = { variant, metrics: Object.fromEntries(metrics.filter(x => ['LayoutDuration', 'RecalcStyleDuration', 'ScriptDuration', 'TaskDuration', 'LayoutCount', 'RecalcStyleCount', 'Nodes', 'JSHeapUsedSize'].includes(x.name)).map(x => [x.name, x.value])), styles: await page.locator('#home-hero-banner h1').evaluate(el => ({ font: getComputedStyle(el).fontFamily, textRendering: getComputedStyle(el).textRendering })) };
    results.push(row);
    console.log(JSON.stringify(row));
    await context.close();
    await browser.close();
  }
  writeFileSync(resolve(output, 'layout-profile-fresh-browser.json'), JSON.stringify({ diagnosticOnly: true, results }, null, 2));
} finally { if (browser) await browser.close(); }
