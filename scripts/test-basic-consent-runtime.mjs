import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// Chạy bản dựng thật trong trình duyệt riêng; giả phản hồi nhà cung cấp và không gửi dữ liệu quảng cáo.
const runtime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__consent_test.cjs'));
const { chromium } = runtime('playwright');
const origin = process.env.UI_TEST_ORIGIN || 'http://127.0.0.1:3002';
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, timeout: 60000 });
let context;
try {
  context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  let blocked = false;
  let policyRequests = 0;
  const googleRequests = [];
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname === '/api/tracking-policy') {
      policyRequests++;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ blocked }) });
    }
    const hosts = ['googletagmanager.com', 'google-analytics.com', 'googlesyndication.com', 'doubleclick.net', 'googleadservices.com', 'facebook.net', 'facebook.com', 'tiktok.com'];
    if (hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
      googleRequests.push(url.hostname);
      return route.fulfill({ contentType: 'application/javascript', body: '/* Nhà cung cấp giả lập */' });
    }
    return route.continue();
  });

  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const dialog = page.getByRole('alertdialog', { name: 'Thông báo cookie' });
  try {
    await dialog.waitFor();
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      title: document.title,
      body: document.body?.innerText?.slice(0, 400),
      consent: localStorage.getItem('cookie_consent'),
      dialogs: document.querySelectorAll('[role="alertdialog"]').length,
    }));
    throw new Error(`Thông báo cookie không hiển thị: ${JSON.stringify({ diagnostics, pageErrors })}`, { cause: error });
  }
  await page.waitForTimeout(2500);
  assert.equal(policyRequests, 0, 'Chưa đồng ý thì không gọi kiểm tra IP');
  assert.equal(googleRequests.length, 0, 'Chưa đồng ý thì không yêu cầu nhà cung cấp');
  assert.equal(await page.locator('#gtm-tracker-script').count(), 0);

  await dialog.getByRole('button', { name: 'Đồng ý', exact: true }).click();
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'allowed');
  await page.locator('#gtm-tracker-script').waitFor({ state: 'attached' });
  await page.waitForFunction(() => (window.dataLayer || []).some(row => row?.event === 'consent_granted'));
  assert.ok(googleRequests.some(host => host.endsWith('googletagmanager.com')));
  assert.equal(await page.evaluate(() => window.dataLayer.filter(row => row[0] === 'consent').at(-1)[2].ad_storage), 'granted');

  const afterGrantedRequests = googleRequests.length;
  const revokedReload = page.waitForEvent('load');
  await page.evaluate(() => {
    localStorage.setItem('cookie_consent', 'declined');
    window.dispatchEvent(new CustomEvent('cookie_consent_changed', { detail: { status: 'declined' } }));
  });
  await revokedReload;
  await page.getByRole('alertdialog', { name: 'Thông báo cookie' }).waitFor();
  assert.equal(await page.locator('#gtm-tracker-script').count(), 0, 'Thu hồi phải dừng GTM ở trang mới');
  assert.equal(googleRequests.length, afterGrantedRequests, 'Từ chối lại không gửi thêm yêu cầu Google');

  blocked = true;
  await page.evaluate(() => localStorage.setItem('cookie_consent', 'accepted'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'blocked');
  assert.equal(await page.locator('#gtm-tracker-script').count(), 0, 'IP bị chặn không tải GTM dù đã đồng ý');
  blocked = false;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'allowed');
  await page.locator('#gtm-tracker-script').waitFor({ state: 'attached' });
  blocked = true;
  const blockedReload = page.waitForEvent('load');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await blockedReload;
  await page.waitForFunction(() => window.__greeniaIpTrackingPolicy === 'blocked');
  assert.equal(await page.locator('#gtm-tracker-script').count(), 0, 'Chặn IP trong phiên phải dừng mã GTM');
  console.log(JSON.stringify({ passed: true, cases: ['chưa đồng ý không gửi yêu cầu ngoài', 'đồng ý và IP hợp lệ mới tải GTM', 'thu hồi đồng ý dừng thẻ', 'IP bị chặn không tải thẻ', 'chặn IP khi đang mở dừng thẻ'], policyRequests }));
} finally {
  await context?.close();
  await browser.close();
}
