import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import nextEnv from '@next/env';

// Tài khoản và mọi phản hồi Supabase/API đều giả lập; không tạo phiên hay sửa khách thật.
nextEnv.loadEnvConfig(process.cwd());
const runtime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__test.cjs'));
const { chromium } = runtime('playwright');
const origin = process.env.UI_TEST_ORIGIN || 'http://127.0.0.1:3001';
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const backend = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
const output = resolve('docs/implementation-2026-09-28');
mkdirSync(output, { recursive: true });
console.log('Đang mở trình duyệt kiểm thử...');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, timeout: 60000 });
const results = [];
try {
  for (const role of ['admin', 'editor', 'member']) {
    console.log('Đang kiểm tra CRM:', role);
    const email = `${role}@example.com`;
    const uid = '00000000-0000-0000-0000-000000000001';
    const profile = { uid, email, role, username: 'Nhân viên kiểm thử' };
    const staff = [profile, { uid: '00000000-0000-0000-0000-000000000002', email: 'other@example.com', role: 'member', username: 'Nhân viên khác' }];
    const user = { id: uid, aud: 'authenticated', role: 'authenticated', email, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString() };
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: uid, aud: 'authenticated', role: 'authenticated', email, exp: expires, iat: expires - 3600 })}.local-test-only`;
    const session = { access_token: token, refresh_token: 'local-test-only', expires_at: expires, expires_in: 3600, token_type: 'bearer', user };
    const rows = Array.from({ length: role === 'member' ? 1 : 28 }, (_, index) => ({ id: `lead-${index + 1}`, data: { name: `Khách kiểm thử ${index + 1}`, phone: '0901234567', status: 'new', assignee: email, createdAt: new Date().toISOString(), careHistory: [] } }));
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    await context.routeWebSocket(`wss://${backend.host}/**`, (socket) => socket.close());
    await context.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: `sb-${backend.hostname.split('.')[0]}-auth-token`, value: session });
    const respond = (route, value) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(value) });
    await context.route(backend.origin + '/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const table = url.pathname.split('/').pop();
      if (url.pathname.startsWith('/auth/v1/')) return respond(route, user);
      if (table === 'query_consultations') {
        const args = request.postDataJSON();
        const filtered = rows.filter((row) => (!args.p_search || row.data.name.includes(args.p_search)) && (args.p_status === 'all' || args.p_status === row.data.status));
        const start = (args.p_page - 1) * args.p_page_size;
        return respond(route, { rows: filtered.slice(start, start + args.p_page_size), total: filtered.length, stats: { total: rows.length, new: rows.filter(row => row.data.status === 'new').length } });
      }
      if (['patch_consultation', 'append_consultation_care_history'].includes(table)) {
        const args = request.postDataJSON(); const row = rows.find(item => item.id === args.p_id);
        assert.ok(row, 'Chỉ cập nhật khách giả được tạo trong phép thử');
        if (table === 'patch_consultation') Object.assign(row.data, args.p_patch);
        else row.data.careHistory.push({ note: args.p_note, author: email, time: Date.now() });
        return respond(route, row.data);
      }
      if (request.method() !== 'GET') return route.fulfill({ status: 403, body: 'Chặn mọi ghi không thuộc phép thử' });
      if (table === 'users') return respond(route, url.searchParams.has('uid') ? profile : role === 'member' ? [profile] : staff);
      if (table === 'consultations') return respond(route, rows.find(row => `eq.${row.id}` === url.searchParams.get('id')) || null);
      if (table === 'settings' && url.searchParams.has('id')) return respond(route, { id: 'general', data: { quotePopupEnabled: false, cookieConsentEnabled: false, adSenseSettings: { enabled: false } } });
      return respond(route, []);
    });
    await context.route('**/api/**', async (route) => {
      if (route.request().url().endsWith('/api/tracking-policy')) return respond(route, { blocked: true });
      if (/\/api\/(?:send-email|push\/notify-)/.test(route.request().url())) return respond(route, { success: true });
      return route.fulfill({ status: 403, body: 'Chặn API ngoài phép thử' });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(origin + '/admin?section=leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const crm = page.locator('#crm-workspace');
    await crm.getByRole('heading', { name: 'Hệ thống CRM' }).waitFor();
    await crm.getByRole('button', { name: 'Mở hồ sơ', exact: true }).first().waitFor();
    if (role === 'admin') {
      assert.equal(await crm.getByRole('button', { name: 'Mở hồ sơ', exact: true }).count(), 25);
      await crm.getByRole('button', { name: 'Trang sau', exact: true }).click();
      await crm.getByText('Khách kiểm thử 28', { exact: true }).waitFor();
      await crm.getByRole('button', { name: 'Trang trước', exact: true }).click();
      await crm.getByText('Khách kiểm thử 1', { exact: true }).waitFor();
      await page.evaluate(() => { document.querySelector('#wp-inner-body')?.scrollTo(0, 0); window.scrollTo(0, 0); });
      await page.screenshot({ path: resolve(output, 'crm-list-local-test.png') });
    }
    await crm.getByRole('button', { name: 'Mở hồ sơ', exact: true }).first().click();
    await crm.getByLabel('Giai đoạn khách hàng').selectOption('contacted');
    await page.getByRole('status').filter({ hasText: 'Đã lưu thay đổi khách hàng' }).waitFor();
    assert.equal(rows[0].data.status, 'contacted');
    const assignment = crm.getByRole('combobox').nth(2);
    assert.equal(await assignment.isDisabled(), role === 'member');
    if (role !== 'member') {
      await assignment.selectOption('other@example.com');
      await page.getByRole('status').filter({ hasText: 'Đã lưu thay đổi khách hàng' }).waitFor();
      assert.equal(rows[0].data.assignee, 'other@example.com');
    }
    await crm.getByLabel('Ghi chú mới').fill(`Ghi chú vai trò ${role}`);
    await crm.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click();
    await crm.getByText(`Ghi chú vai trò ${role}`, { exact: true }).waitFor();
    assert.equal(rows[0].data.careHistory[0].author, email);
    assert.equal(await crm.getByRole('button', { name: 'Xóa khách', exact: true }).count(), role === 'admin' ? 1 : 0);
    if (role === 'admin') {
      await page.evaluate(() => { document.querySelector('#wp-inner-body')?.scrollTo(0, 0); window.scrollTo(0, 0); });
      await page.screenshot({ path: resolve(output, 'crm-detail-local-test.png') });
    }
    results.push({ role, passed: true, tests: ['Hiển thị CRM', 'Đổi giai đoạn', 'Phân công theo vai trò', 'Ghi chú chăm sóc', 'Quyền hiển thị xóa', ...(role === 'admin' ? ['Phân trang 25 + 3'] : [])] });
    await context.close();
  }
  writeFileSync(resolve(output, 'crm-ui-results.json'), JSON.stringify({ passed: true, mockedBackend: true, results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  let closeTimer;
  try { await Promise.race([browser.close(), new Promise((_, reject) => { closeTimer = setTimeout(() => reject(new Error('Quá thời gian đóng trình duyệt kiểm thử')), 10000); })]); }
  finally { clearTimeout(closeTimer); }
}
