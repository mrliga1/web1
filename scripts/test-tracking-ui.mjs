import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// Chỉ chạy cục bộ, giả lập nhà cung cấp và thao tác chặn IP; không ghi dữ liệu thật.
// Bản dựng kiểm thử cần NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID; không cần khóa máy chủ Supabase thật.
const requireRuntime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__test.cjs'));
const { chromium } = requireRuntime('playwright');
const origin = process.env.UI_TEST_ORIGIN || 'http://127.0.0.1:3001';
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({ serviceWorkers: 'block' });
const page = await context.newPage();
page.setDefaultTimeout(20000);
let blocked = true;
const results = [];
await page.addInitScript(() => {
  localStorage.setItem('cookie_consent', 'accepted');
  window.__testMetaCalls = [];
  window.fbq = (...args) => window.__testMetaCalls.push(args);
  window.ttq = { track() {}, revokeConsent() {}, grantConsent() {} };
});
await page.route('**/*', async route => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.origin === origin && url.pathname === '/api/tracking-policy') {
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ blocked }) });
  }
  if (url.origin === origin && request.method() !== 'GET') {
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, views: 0 }) });
  }
  const hosts = ['googletagmanager.com', 'google-analytics.com', 'facebook.net', 'facebook.com', 'doubleclick.net', 'tiktok.com', 'googleadservices.com', 'googlesyndication.com'];
  if (hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
    return route.fulfill({ contentType: 'application/javascript', body: '/* Nhà cung cấp giả lập */' });
  }
  return route.continue();
});

try {
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'blocked');
  assert.equal(await page.locator('#gtm-tracker-script').count(), 0);
  assert.equal(await page.evaluate(() => window.__testMetaCalls.filter(row => row[0] === 'track').length), 0);
  results.push('IP đã chặn không khởi tạo GTM hoặc phát Meta khi vào trang');

  blocked = false;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'allowed');
  await page.locator('#gtm-tracker-script').waitFor({ state: 'attached' });
  results.push('Bỏ chặn thủ công cho phép khởi tạo tracking');

  blocked = true;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'blocked');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('cookie_consent_changed', { detail: { status: 'accepted' } })));
  const state = await page.evaluate(() => ({
    consent: window.__greeniaTrackingConsent,
    metaConsent: window.__testMetaCalls.filter(row => row[0] === 'consent').at(-1)?.[1],
    googleConsent: window.dataLayer.filter(row => row[0] === 'consent').at(-1)?.[2],
  }));
  assert.equal(state.consent, 'denied');
  assert.equal(state.metaConsent, 'revoke');
  assert.equal(state.googleConsent.ad_personalization, 'denied');
  results.push('Chặn khi tab đang mở thu hồi quyền quảng cáo, đồng ý cookie không vượt chặn IP');

  await page.getByRole('link', { name: 'Tin Tức', exact: true }).first().click();
  await page.waitForURL(origin + '/tin-tuc');
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'blocked');
  assert.equal(await page.evaluate(() => (window.__greeniaPolicyEvents || []).length), 0);
  results.push('Chuyển trang kiểm tra lại IP và hủy sự kiện chờ của IP đã chặn');

  await page.evaluate(() => window.dispatchEvent(new CustomEvent('cookie_consent_changed', { detail: { status: 'declined' } })));
  blocked = false;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'allowed');
  assert.equal(await page.evaluate(() => window.__greeniaTrackingConsent), 'denied');
  results.push('Bỏ chặn không tự cấp lại đồng ý cookie');
  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
