import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Kiểm tra mã thật với dịch vụ giả lập; không gửi sự kiện quảng cáo hoặc sửa IP thật.
function load(path, mocks = {}, globals = {}) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  runInNewContext(outputText, { module, exports: module.exports, Event, ...globals,
    require(name) {
      assert.ok(Object.hasOwn(mocks, name), `Thiếu giả lập ${name}`);
      return mocks[name];
    },
  });
  return module.exports;
}

const ipHelpers = load('app/api/lib/ipAddress.ts', { 'node:net': { isIP } });
function policyHarness() {
  let ips = [];
  let unavailable = false;
  const api = load('app/api/tracking-policy/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200, headers: options.headers }) } },
    '../lib/blockedIps': {
      ...ipHelpers,
      getBlockedIpsForRequest: async (options) => {
        assert.equal(options.strict, true);
        if (unavailable) throw new Error('Lỗi thử nghiệm');
        return ips;
      },
    },
  });
  return {
    setIps: (value) => { ips = value; }, fail: () => { unavailable = true; },
    get: () => api.GET({ headers: new Headers({ 'x-real-ip': '::ffff:192.0.2.10' }) }),
  };
}

test('Chính sách kiểm tra danh sách thủ công hiện hành, không dùng điểm spam hoặc cache', async () => {
  const h = policyHarness();
  assert.equal((await h.get()).body.blocked, false);
  h.setIps(['192.0.2.10']);
  const blocked = await h.get();
  assert.equal(blocked.body.blocked, true);
  assert.deepEqual(Object.keys(blocked.body), ['blocked']);
  assert.match(blocked.headers['Cache-Control'], /private, no-store/);
  h.setIps([]);
  assert.equal((await h.get()).body.blocked, false);
});
test('Không xác minh được IP trả 503, không giả báo đã kiểm tra thành công', async () => {
  const h = policyHarness(); h.fail();
  const result = await h.get();
  assert.equal(result.status, 503);
  assert.equal(result.body.blocked, undefined);
});

function trackingHarness() {
  const meta = [];
  const tiktok = [];
  const permissions = [];
  const window = Object.assign(new EventTarget(), {
    fbq: (...args) => meta.push(args),
    ttq: { track: (...args) => tiktok.push(args), grantConsent: () => permissions.push('grant'), revokeConsent: () => permissions.push('revoke') },
  });
  const api = load('src/lib/tracking.ts', {}, { window });
  return { api, window, meta, tiktok, permissions,
    metaEvents: () => meta.filter(row => row[0] === 'track' || row[0] === 'trackCustom'),
    googleEvents: () => (window.dataLayer || []).filter(row => !Array.isArray(row) && row.event),
  };
}
test('Chờ kiểm tra IP trước khi gửi sự kiện, cho phép thì phát đúng một lần', () => {
  const h = trackingHarness();
  h.api.setTrackingConsent('granted');
  h.api.trackLead('form', 'project');
  assert.equal(h.api.canLoadTrackingScripts(), false);
  assert.equal(h.metaEvents().length, 0);
  assert.equal(h.googleEvents().length, 0);
  h.api.setManualIpTrackingPolicy('allowed');
  assert.equal(h.api.hasMarketingTrackingConsent(), true);
  assert.equal(h.metaEvents().length, 1);
  assert.equal(h.googleEvents().length, 1);
  h.api.setManualIpTrackingPolicy('allowed');
  assert.equal(h.metaEvents().length, 1);
});
test('Chặn IP thu hồi quyền quảng cáo, không phát sự kiện dù khách bấm đồng ý cookie', () => {
  const h = trackingHarness();
  h.api.setManualIpTrackingPolicy('allowed');
  h.api.setTrackingConsent('granted');
  h.api.trackLead('form', 'project');
  h.api.setManualIpTrackingPolicy('blocked');
  h.api.setTrackingConsent('granted');
  for (const event of ['page_view', 'generate_lead', 'view_item', 'share']) h.api.pushTrackingEvent(event);
  assert.equal(h.metaEvents().length, 1);
  assert.equal(h.tiktok.length, 1);
  assert.equal(h.googleEvents().length, 1);
  assert.equal(h.api.hasMarketingTrackingConsent(), false);
  assert.equal(h.meta.at(-1)[1], 'revoke');
  assert.equal(h.permissions.at(-1), 'revoke');
  const consent = h.window.dataLayer.filter(row => row[0] === 'consent').at(-1)[2];
  assert.equal(consent.ad_personalization, 'denied');
  assert.equal(consent.ad_user_data, 'denied');
});
test('Hàng đợi có giới hạn, chặn thì hủy; bỏ chặn không phát lại các lượt đã bị loại', () => {
  const h = trackingHarness();
  h.api.setTrackingConsent('granted');
  for (let i = 0; i < 100; i++) h.api.trackLead('form', String(i));
  assert.equal(h.window.__greeniaPolicyEvents.length, 50);
  h.api.setManualIpTrackingPolicy('blocked');
  h.api.setManualIpTrackingPolicy('allowed');
  assert.equal(h.metaEvents().length, 0);
  h.api.trackLead('form', 'new');
  assert.equal(h.metaEvents().length, 1);
});
test('Bỏ chặn IP không biến lựa chọn từ chối cookie thành đồng ý', () => {
  const h = trackingHarness();
  h.api.setTrackingConsent('denied');
  h.api.setManualIpTrackingPolicy('blocked');
  h.api.setManualIpTrackingPolicy('allowed');
  h.api.trackLead('form', 'new');
  assert.equal(h.metaEvents().length, 0);
  assert.equal(h.api.hasMarketingTrackingConsent(), false);
});

test('Kiểm tra lại IP hoặc chuyển trang không kích hoạt thẻ đồng ý trùng', () => {
  const h = trackingHarness();
  h.api.setTrackingConsent('granted');
  h.api.setManualIpTrackingPolicy('allowed');
  h.api.notifyTrackingConsentGranted();
  for (const state of ['pending', 'allowed', 'blocked', 'allowed']) {
    h.api.setManualIpTrackingPolicy(state);
    h.api.notifyTrackingConsentGranted();
  }
  assert.equal(h.googleEvents().filter(row => row.event === 'consent_granted').length, 1);
  h.api.setTrackingConsent('denied');
  h.api.setTrackingConsent('granted');
  h.api.notifyTrackingConsentGranted();
  assert.equal(h.googleEvents().filter(row => row.event === 'consent_granted').length, 2);
});

test('Dọn bộ kiểm tra IP khi ẩn tab/rời trang, hủy kết nối và không cập nhật từ yêu cầu cũ', async () => {
  let effect;
  let sequence = 0;
  let signal;
  let respond;
  const timeouts = new Map();
  const intervals = new Map();
  const states = [];
  const window = new EventTarget();
  const document = Object.assign(new EventTarget(), { hidden: false });
  const api = load('src/hooks/useManualIpTrackingPolicy.ts', {
    react: { useEffect: (callback) => { effect = callback; } },
    '../lib/tracking': { setManualIpTrackingPolicy: (state) => states.push(state) },
  }, {
    window, document, AbortController,
    setTimeout: (fn, delay) => { assert.ok(delay <= 60000); timeouts.set(++sequence, fn); return sequence; },
    clearTimeout: (id) => timeouts.delete(id),
    setInterval: (fn, delay) => { assert.equal(delay, 30000); intervals.set(++sequence, fn); return sequence; },
    clearInterval: (id) => intervals.delete(id),
    fetch: (_url, options) => { signal = options.signal; return new Promise(resolve => { respond = resolve; }); },
  });
  api.useManualIpTrackingPolicy('/du-an/test');
  const cleanup = effect();
  assert.equal(intervals.size, 1);
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(intervals.size, 0);
  cleanup();
  assert.equal(signal.aborted, true);
  assert.equal(timeouts.size, 0);
  respond({ ok: true, json: async () => ({ blocked: false }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(states.includes('allowed'), false);
  document.hidden = false;
  window.dispatchEvent(new Event('focus'));
  assert.equal(intervals.size, 0);
});
