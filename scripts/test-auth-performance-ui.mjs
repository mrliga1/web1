import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import nextEnv from '@next/env';

// Chỉ xác thực với phản hồi giả trên máy cục bộ, không gửi thông tin đăng nhập thật.
nextEnv.loadEnvConfig(process.cwd());
const runtime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__test.cjs'));
const { chromium } = runtime('playwright');
const origin = process.env.UI_TEST_ORIGIN || 'http://127.0.0.1:3001';
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const backend = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
const output = resolve('docs/performance-2026-09-29');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, timeout: 60000 });
const results = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await context.routeWebSocket(`wss://${backend.host}/**`, socket => socket.close());
  const uid = '00000000-0000-0000-0000-000000000001';
  const email = 'local-test@example.com';
  const profile = { uid, email, role: 'user', username: 'Tài khoản kiểm thử' };
  const user = { id: uid, aud: 'authenticated', role: 'authenticated', email, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString() };
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: uid, aud: 'authenticated', role: 'authenticated', email, exp: expires, iat: expires - 3600 })}.local-test-only`;
  let writes = 0;
  let settingsReads = 0;
  let layoutReads = 0;
  let authCalls = 0;
  const respond = (route, value) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(value) });
  await context.route(backend.origin + '/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/token')) {
      authCalls++;
      assert.equal(request.postDataJSON().email, email);
      return respond(route, { access_token: token, refresh_token: 'local-test-only', expires_in: 3600, token_type: 'bearer', user });
    }
    if (url.pathname.endsWith('/logout')) return respond(route, {});
    if (url.pathname.startsWith('/auth/v1/')) { authCalls++; return respond(route, user); }
    if (request.method() !== 'GET') { writes++; return route.fulfill({ status: 403, body: 'Chặn ghi ngoài phép thử' }); }
    if (url.pathname.endsWith('/settings')) settingsReads++;
    if (url.pathname.endsWith('/layouts')) layoutReads++;
    if (url.pathname.endsWith('/users')) return respond(route, profile);
    return respond(route, []);
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  console.log('Đang mở trang khách mới');
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const consent = page.getByRole('alertdialog', { name: 'Thông báo cookie' });
  await consent.waitFor();
  await consent.getByRole('button', { name: 'Đóng', exact: true }).click();
  assert.equal(authCalls, 0);
  assert.equal(settingsReads, 0);
  assert.equal(writes, 0);
  results.push('Khách mới không truy vấn lại settings, không gọi API xác thực và không ghi dữ liệu');
  await page.goto(origin + '/lien-he', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('main h1').first().waitFor();
  const contactConsent = page.getByRole('alertdialog', { name: 'Thông báo cookie' });
  await contactConsent.waitFor();
  await contactConsent.getByRole('button', { name: 'Đóng', exact: true }).click();
  assert.equal(layoutReads, 0);
  assert.equal(settingsReads, 0);
  assert.equal(authCalls, 0);
  assert.equal(writes, 0);
  results.push('Trang liên hệ có bố cục từ máy chủ, không đọc lại layouts ở trình duyệt');
  await page.locator('#footer').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Về đầu trang', exact: true }).click();
  await page.waitForFunction(() => window.scrollY <= 1);
  results.push('Chân trang dựng trên máy chủ vẫn có nút về đầu trang hoạt động');
  console.log('Trang liên hệ và chân trang đạt, đang mở đăng nhập');
  await page.locator('#login-btn').click();
  const dialog = page.getByRole('dialog').last();
  await dialog.waitFor();
  assert.equal(await page.getByRole('dialog').count(), 1);
  await dialog.getByLabel('Email', { exact: true }).fill(email);
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill('local-test-only-password');
  await dialog.getByRole('button', { name: 'Đăng nhập vào hệ thống', exact: true }).click();
  await page.locator('#login-btn').waitFor({ state: 'detached' });
  assert.equal(authCalls, 1);
  results.push('Đăng nhập theo nhu cầu cập nhật phiên và hồ sơ');
  console.log('Đăng nhập đạt, đang khôi phục phiên');
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByRole('alertdialog', { name: 'Thông báo cookie' }).waitFor();
  assert.equal(await page.locator('#login-btn').count(), 0);
  results.push('Tải lại trang khôi phục tài khoản đã đăng nhập');
  assert.deepEqual(errors, []);
  assert.equal(writes, 0);
  await context.close();
  writeFileSync(resolve(output, 'auth-ui-results.json'), JSON.stringify({ passed: true, mockedBackend: true, results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
} catch (error) { console.error('Kiểm thử đăng nhập thất bại:', error); throw error; } finally {
  let timer;
  try { await Promise.race([browser.close(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Quá thời gian đóng trình duyệt')), 30000); })]); }
  finally { clearTimeout(timer); }
}
