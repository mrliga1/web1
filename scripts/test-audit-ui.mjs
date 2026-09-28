import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Chỉ chạy trên bản cục bộ, giả lập gửi form để không tạo khách hoặc email thật.
const requireRuntime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__test.cjs'));
const { chromium } = requireRuntime('playwright');
const origin = process.env.UI_TEST_ORIGIN || 'http://127.0.0.1:3001';
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const output = resolve('docs/implementation-2026-09-28');
mkdirSync(output, { recursive: true });
console.log('Đang mở trình duyệt kiểm thử...');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, timeout: 60000 });
console.log('Đã mở trình duyệt.');
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on('pageerror', (error) => console.log('Lỗi trình duyệt:', error.message));
let failSubmission = true;
let submissions = 0;
const results = [];
await page.route('**/api/consultations', async (route) => {
  submissions++;
  console.log('Đã nhận lần gửi biểu mẫu:', submissions);
  await route.fulfill({ status: failSubmission ? 503 : 200, contentType: 'application/json', body: JSON.stringify(failSubmission ? { error: 'Lỗi kiểm thử cục bộ' } : { id: 'local-test-only', success: true, trackingEligible: false }) });
});
await page.route('**/api/tracking-policy', (route) => route.fulfill({ contentType: 'application/json', body: '{"blocked":true}' }));
await page.route(/https:\/\/[^/]*(google-analytics\.com|facebook\.com|googlesyndication\.com|googletagmanager\.com)\//, (route) => route.fulfill({ status: 204 }));
try {
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('heading', { level: 1, name: 'Tìm bất động sản phù hợp, an tâm trong từng quyết định' }).waitFor();
  await page.locator('#home-hero-banner img').first().evaluate((image) => image.decode());
  await page.screenshot({ path: resolve(output, 'home-desktop.png') });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.getByRole('link', { name: 'Xem bất động sản', exact: true }).click();
  await page.waitForURL(origin + '/san-pham');
  results.push('CTA banner dẫn tới URL thật');

  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  const cookieDialog = page.getByRole('alertdialog', { name: 'Thông báo cookie' });
  await cookieDialog.waitFor();
  await cookieDialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  const form = page.locator('#home-hero-banner form');
  await form.getByRole('textbox', { name: 'Họ tên', exact: true }).fill('Khách kiểm thử');
  await form.getByRole('textbox', { name: 'Số điện thoại', exact: true }).fill('0901234567');
  await form.getByRole('textbox', { name: 'Địa chỉ Email', exact: true }).fill('test@example.com');
  const checkboxes = form.getByRole('checkbox');
  assert.equal(await checkboxes.count(), 2);
  for (let index = 0; index < 2; index++) await checkboxes.nth(index).check();
  await form.getByRole('button', { name: 'Nhận tư vấn ngay', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Không thể gửi yêu cầu tư vấn' }).waitFor();
  assert.equal(await form.getByRole('textbox', { name: 'Số điện thoại', exact: true }).inputValue(), '0901234567');
  results.push('Lỗi API hiện thông báo và giữ dữ liệu form');
  failSubmission = false;
  await form.getByRole('button', { name: 'Nhận tư vấn ngay', exact: true }).click();
  await page.getByText('Chúng tôi đã nhận được yêu cầu và sẽ liên hệ qua số 0901234567.', { exact: true }).waitFor();
  assert.equal(submissions, 2);
  results.push('Gửi thành công có xác nhận và số liên hệ');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: resolve(output, 'home-mobile.png') });
  results.push('Desktop và di động không tràn ngang');

  const corrupted = await browser.newContext({ serviceWorkers: 'block' });
  await corrupted.addInitScript(() => {
    localStorage.setItem('saved_favorites', '{sai-json');
    localStorage.setItem('recentlyViewed', '{}');
  });
  await corrupted.route('**/api/tracking-policy', route => route.fulfill({ contentType: 'application/json', body: '{"blocked":true}' }));
  const recoveryPage = await corrupted.newPage();
  await recoveryPage.goto(origin, { waitUntil: 'domcontentloaded' });
  await recoveryPage.getByRole('alertdialog', { name: 'Thông báo cookie' }).waitFor();
  await recoveryPage.getByRole('alertdialog', { name: 'Thông báo cookie' }).getByRole('button', { name: 'Đóng', exact: true }).click();
  const favorite = recoveryPage.locator('a[data-content-link="product"]').first();
  await favorite.getByRole('button', { name: 'Thêm vào yêu thích', exact: true }).click();
  await favorite.getByRole('button', { name: 'Bỏ yêu thích', exact: true }).waitFor();
  assert.equal(await recoveryPage.evaluate(() => JSON.parse(localStorage.getItem('saved_favorites')).length), 1);
  await corrupted.close();
  results.push('Dữ liệu trình duyệt hỏng không làm lỗi trang; có thể lưu yêu thích lại');
  console.log('Đã đạt form và giao diện; đang kiểm tra HTTP 404.');
  for (const route of ['/category-product/khong-ton-tai-audit', '/category-news/khong-ton-tai-audit', '/san-pham/khong-ton-tai-audit', '/du-an/khong-ton-tai-audit', '/tin-tuc/khong-ton-tai-audit']) {
    const response = await page.request.get(origin + route);
    assert.equal(response.status(), 404, route);
  }
  results.push('Danh mục và chi tiết không tồn tại trả HTTP 404 thật');
  const filtered = await page.request.get(origin + '/san-pham?location=KhongTonTaiAudit');
  const html = await filtered.text();
  assert.match(html, /name="robots" content="noindex,\s?follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/greeniahomes.vn\/san-pham"/);
  results.push('Bộ lọc chưa cấu hình noindex và canonical đúng');
  const unauthorized = await page.request.post(origin + '/api/send-email', { data: { leadId: 'local-test-only', email: 'test@example.com' } });
  assert.equal(unauthorized.status(), 403);
  results.push('API email không xác thực bị từ chối');
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(origin, { waitUntil: 'domcontentloaded' });
  await noJsPage.getByRole('heading', { level: 1 }).waitFor();
  assert.equal(await noJsPage.getByRole('link', { name: 'Xem bất động sản', exact: true }).getAttribute('href'), '/san-pham');
  for (const path of ['/chinh-sach-bao-mat', '/dieu-khoan-su-dung']) {
    await noJsPage.goto(origin + path, { waitUntil: 'domcontentloaded' });
    await noJsPage.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await noJsPage.getByRole('link', { name: 'Liên hệ', exact: true }).last().getAttribute('href'), '/lien-he');
  }
  await noJs.close();
  results.push('Nội dung và liên kết chính có sẵn khi tắt JavaScript');
  console.log('Đã đạt 404, metadata và HTML không JavaScript; đang kiểm tra quảng cáo.');
  const adsContext = await browser.newContext({ serviceWorkers: 'block' });
  let adsRequests = 0;
  await adsContext.route('**/api/tracking-policy', (route) => route.fulfill({ contentType: 'application/json', body: '{"blocked":false}' }));
  await adsContext.route(/https:\/\/[^/]*(google|doubleclick|facebook|tiktok)[^/]*\//, async (route) => {
    if (route.request().url().includes('/pagead/js/adsbygoogle.js')) adsRequests++;
    await route.fulfill({ contentType: 'application/javascript', body: '' });
  });
  const adsPage = await adsContext.newPage();
  await adsPage.goto(origin, { waitUntil: 'domcontentloaded' });
  const consentDialog = adsPage.getByRole('alertdialog', { name: 'Thông báo cookie' });
  await consentDialog.waitFor();
  assert.equal(adsRequests, 0, 'Chưa đồng ý thì không tải quảng cáo');
  await consentDialog.getByRole('button', { name: 'Đồng ý', exact: true }).click();
  await adsPage.waitForFunction(() => document.getElementById('greenia-adsense-script')?.dataset.loaded === 'true');
  assert.equal(adsRequests, 1, 'Đồng ý và IP hợp lệ chỉ tải quảng cáo một lần');
  const reloaded = adsPage.waitForEvent('load');
  await adsPage.evaluate(() => {
    localStorage.setItem('cookie_consent', 'declined');
    window.dispatchEvent(new CustomEvent('cookie_consent_changed', { detail: { status: 'declined' } }));
  });
  await reloaded;
  await adsPage.getByRole('alertdialog', { name: 'Thông báo cookie' }).waitFor();
  assert.equal(adsRequests, 1, 'Thu hồi đồng ý dừng trang cũ và không tải lại quảng cáo');
  await adsContext.close();
  results.push('Quảng cáo chỉ tải sau đồng ý và kiểm tra IP; thu hồi đồng ý dừng trang cũ');
  writeFileSync(resolve(output, 'ui-results.json'), JSON.stringify({ passed: true, results }, null, 2));
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} catch (error) {
  console.error('Kiểm tra giao diện thất bại:', error);
  console.log('Thông báo đang hiển thị:', await page.locator('[role="alert"], [role="status"]').allTextContents());
  await page.screenshot({ path: resolve(output, 'ui-failure.png') }).catch(() => {});
  throw error;
} finally {
  let closeTimer;
  try { await Promise.race([browser.close(), new Promise((_, reject) => { closeTimer = setTimeout(() => reject(new Error('Quá thời gian đóng trình duyệt kiểm thử')), 30000); })]); }
  finally { clearTimeout(closeTimer); }
}
