import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Nạp mã thật với dịch vụ giả lập để kiểm thử không ghi dữ liệu hoặc gửi thông báo thật.
function loadModule(path, mocks = {}, globals = {}) {
  const filename = resolve(path);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
    fileName: filename,
  });
  const module = { exports: {} };
  runInNewContext(outputText, {
    module, exports: module.exports, console: { error() {}, warn() {} }, ...globals,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error(`Chưa giả lập mô-đun: ${name}`);
    },
  }, { filename });
  return module.exports;
}

const access = loadModule('src/lib/crmAccess.ts');
const validation = loadModule('src/lib/consultationValidation.ts');
const sourceContext = loadModule('src/lib/consultationContext.ts', {}, { URL });

test('Popup phân biệt trang mở và trang gửi, giữ tên nội dung và URL', () => {
  const opened = sourceContext.createConsultationContext('https://greeniahomes.vn/du-an/vinhomes-can-gio#contact', 'Vinhomes Cần Giờ');
  const submitted = sourceContext.createConsultationContext('https://greeniahomes.vn/san-pham/can-ho-quan-2', 'Căn hộ Quận 2');
  assert.equal(opened.sourceUrl, 'https://greeniahomes.vn/du-an/vinhomes-can-gio');
  assert.equal(opened.propertyTitle, 'Vinhomes Cần Giờ');
  assert.equal(submitted.propertyId, '/san-pham/can-ho-quan-2');
  assert.notEqual(opened.sourceUrl, submitted.sourceUrl);
  assert.equal(sourceContext.createConsultationContext('javascript:alert(1)', '').sourceUrl, '');
});

test('Kiểm tra form trả đúng cảnh báo cho từng trường sai định dạng', () => {
  assert.equal(validation.validateConsultationField('name', 'A'), 'Vui lòng nhập họ tên có ít nhất 2 ký tự.');
  assert.match(validation.validateConsultationField('phone', '12345'), /Số điện thoại/);
  assert.match(validation.validateConsultationField('email', 'sai-email'), /email không đúng định dạng/i);
  assert.equal(validation.validateConsultationField('phone', '0901 234 567'), undefined);
  assert.equal(validation.validateConsultationField('email', '', { emailRequired: false }), undefined);
});

test('Form trang chủ bắt buộc email hợp lệ trước khi gửi', () => {
  const errors = validation.validateConsultation(
    { name: 'Khách hàng', phone: '0901234567', email: '' },
    { emailRequired: true },
  );
  assert.equal(errors.email, 'Vui lòng nhập địa chỉ email.');
});

test('Meta/TikTok tôn trọng từ chối cookie và xóa sự kiện Meta đang chờ', () => {
  const meta = [];
  const tiktok = [];
  const window = { fbq: (...args) => meta.push(args), ttq: { track: (...args) => tiktok.push(args) } };
  const tracking = loadModule('src/lib/tracking.ts', {}, { window });
  tracking.setTrackingConsent('denied');
  tracking.trackLead('test', 'test');
  assert.equal(meta.length, 0);
  assert.equal(tiktok.length, 0);
  tracking.setTrackingConsent('granted');
  tracking.trackLead('test', 'test');
  assert.equal(meta.length, 1);
  assert.equal(tiktok.length, 1);
  window.__greeniaPendingMetaEvents = [{ method: 'track', event: 'Lead', payload: {} }];
  tracking.setTrackingConsent('denied');
  tracking.flushPendingMetaEvents();
  assert.equal(window.__greeniaPendingMetaEvents.length, 0);
  assert.equal(meta.length, 1);
});
test('Phân công so khớp email đầy đủ, không nhận chuỗi con hoặc email trống', () => {
  assert.equal(access.isLeadAssignedTo('Nhân viên (NV@example.com)', 'nv@example.com'), true);
  assert.equal(access.isLeadAssignedTo('othernv@example.com', 'nv@example.com'), false);
  assert.equal(access.isLeadAssignedTo('nv@example.com', ''), false);
});

test('Form có đúng hai checkbox bắt buộc, không tự đánh dấu', () => {
  const { default: Fields } = loadModule('src/components/FormConsentFields.tsx', { react: React });
  const html = renderToStaticMarkup(React.createElement(Fields, {
    idPrefix: 'test', agreeTerms: false, agreePrivacy: false, onTermsChange() {}, onPrivacyChange() {},
  }));
  assert.equal((html.match(/type="checkbox"/g) || []).length, 2);
  assert.equal((html.match(/required=""/g) || []).length, 2);
  assert.equal(html.includes('checked=""'), false);
});

function consultationHarness({ rows = [], lookupError = null, insertError = null, blocked = false } = {}) {
  const inserts = [];
  const jobs = [];
  let notified = 0;
  const { POST } = loadModule('app/api/consultations/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) }, after: (job) => jobs.push(job) },
    '../lib/blockedIps': { getClientIp: () => '192.0.2.10', getBlockedIpsForRequest: async () => [], isBlockedIp: () => blocked },
    '../../../src/lib/serverSupabase': { createServiceRoleClient: () => ({ from: () => ({
      select: () => ({ limit: async () => ({ data: rows, error: lookupError }) }),
      insert: (value) => { inserts.push(value); return { select: () => ({ single: async () => ({ data: insertError ? null : { id: 'lead-test' }, error: insertError }) }) }; },
    }) }) },
    '../../../src/lib/leadNotifications': { notifyLeadStakeholders: async () => { notified += 1; } },
  });
  return { post: (data) => POST({ json: async () => data }), inserts, jobs, notified: () => notified };
}
const validLead = { name: 'Khách kiểm thử', phone: '0901234567', email: 'test@example.com', message: 'Cần tư vấn căn hộ', termsAccepted: true, privacyAccepted: true, marketingConsent: true };

for (const [termsAccepted, privacyAccepted] of [[false, false], [true, false], [false, true]]) {
  test(`Form thiếu đồng ý (${termsAccepted}/${privacyAccepted}) bị từ chối trước khi ghi`, async () => {
    const h = consultationHarness();
    assert.equal((await h.post({ ...validLead, termsAccepted, privacyAccepted })).status, 400);
    assert.equal(h.inserts.length, 0);
  });
}
for (const change of [{ phone: '123' }, { email: 'sai-email' }]) {
  test(`Form sai định dạng ${Object.keys(change)[0]} bị từ chối`, async () => {
    const h = consultationHarness();
    assert.equal((await h.post({ ...validLead, ...change })).status, 400);
    assert.equal(h.inserts.length, 0);
  });
}
test('Form không phụ thuộc cookie; trường quản trị không do khách tự đặt', async () => {
  const h = consultationHarness();
  const result = await h.post({ ...validLead, marketingConsent: false, assignee: 'fake@example.com', status: 'closed', createdAt: '2099-01-01' });
  assert.equal(result.status, 200);
  assert.equal(result.body.trackingEligible, false);
  assert.equal(h.inserts[0].data.status, 'pending');
  assert.equal(h.inserts[0].data.assignee, undefined);
  assert.notEqual(h.inserts[0].data.createdAt, '2099-01-01');
  assert.equal(h.inserts[0].data.message, validLead.message);
  assert.equal(h.jobs.length, 1);
  assert.equal(h.notified(), 0);
  await h.jobs[0]();
  assert.equal(h.notified(), 1);
});
test('Khách đồng ý và qua sàng lọc được đánh dấu đủ điều kiện', async () => {
  assert.equal((await consultationHarness().post(validLead)).body.trackingEligible, true);
});
test('API giữ nguồn trang popup và nội dung khách nhập trong CRM', async () => {
  const h = consultationHarness();
  const context = {
    sourceUrl: 'https://greeniahomes.vn/san-pham/can-ho-quan-2',
    pageTitle: 'Căn hộ Quận 2',
    popupOpenedUrl: 'https://greeniahomes.vn/du-an/vinhomes-can-gio',
    popupOpenedTitle: 'Vinhomes Cần Giờ',
  };
  assert.equal((await h.post({ ...validLead, ...context })).status, 200);
  for (const key of Object.keys(context)) assert.equal(h.inserts[0].data[key], context[key]);
  assert.equal(h.inserts[0].data.message, validLead.message);
});
test('Yêu cầu spam vẫn lưu CRM nhưng không đủ điều kiện remarketing', async () => {
  const rows = Array.from({ length: 5 }, () => ({ data: { phone: validLead.phone, email: validLead.email, ipAddress: '192.0.2.10' } }));
  const h = consultationHarness({ rows });
  assert.equal((await h.post(validLead)).body.trackingEligible, false);
  assert.equal(h.inserts[0].data.spamStatus, 'blocked');
});
test('Sàng lọc lỗi không tự cho phép remarketing', async () => {
  assert.equal((await consultationHarness({ lookupError: { message: 'test' } }).post(validLead)).body.trackingEligible, false);
});
test('IP bị chặn và lỗi lưu không phát thông báo', async () => {
  const blocked = consultationHarness({ blocked: true });
  assert.equal((await blocked.post(validLead)).status, 403);
  assert.equal(blocked.inserts.length, 0);
  const failed = consultationHarness({ insertError: { message: 'test' } });
  assert.equal((await failed.post(validLead)).status, 500);
  assert.equal(failed.jobs.length, 0);
});

const tick = () => new Promise((resolveTick) => setImmediate(resolveTick));
function realtimeHarness() {
  let receive;
  let connection;
  let removed = 0;
  const reads = [];
  const listeners = [];
  const channel = {
    on(_type, _filter, callback) { receive = callback; return this; },
    subscribe(callback) { connection = callback; return this; },
  };
  const api = loadModule('src/firebase-realtime.ts', {
    './supabase': { supabase: { channel: () => channel, removeChannel: async () => { removed += 1; } } },
    './firebase': { getDocs: () => new Promise((resolveRead) => reads.push(resolveRead)), getDoc: () => new Promise((resolveRead) => reads.push(resolveRead)) },
  });
  return { api, reads, listeners, receive: (event) => receive(event), connection: (status) => connection(status), removed: () => removed };
}
const docSnapshot = (id, value) => ({ id, data: () => value, exists: () => true });
const querySnapshot = (docs) => ({ docs, forEach: (fn) => docs.forEach(fn), size: docs.length, empty: docs.length === 0 });
test('Realtime không để bản tải đầu ghi đè sự kiện mới, dọn kênh khi rời trang', async () => {
  const h = realtimeHarness();
  const stop = h.api.onSnapshot(h.api.collectionRealtime({}, 'products'), (value) => h.listeners.push(value));
  h.receive({ eventType: 'UPDATE', old: { id: '1' }, new: { id: '1', data: { title: 'mới' } } });
  h.reads.shift()(querySnapshot([docSnapshot('1', { title: 'cũ' })]));
  await tick();
  assert.equal(h.listeners.at(-1).docs[0].data().title, 'mới');
  stop();
  h.receive({ eventType: 'DELETE', old: { id: '1' }, new: {} });
  assert.equal(h.removed(), 1);
  assert.equal(h.listeners.length, 1);
});
test('Sự kiện tài liệu khác không làm mất snapshot tài liệu đang xem', async () => {
  const h = realtimeHarness();
  const stop = h.api.onSnapshot(h.api.docRealtime({}, 'settings', 'general'), (value) => h.listeners.push(value));
  h.receive({ eventType: 'UPDATE', old: { id: 'other' }, new: { id: 'other', data: {} } });
  h.reads.shift()(docSnapshot('general', { title: 'đúng' }));
  await tick();
  assert.equal(h.listeners.at(-1).data().title, 'đúng');
  stop();
});
test('Kết nối realtime lại tự đọc dữ liệu hiện hành', async () => {
  const h = realtimeHarness();
  const stop = h.api.onSnapshot(h.api.collectionRealtime({}, 'consultations'), (value) => h.listeners.push(value));
  h.reads.shift()(querySnapshot([docSnapshot('1', {})]));
  await tick();
  h.connection('SUBSCRIBED');
  assert.equal(h.reads.length, 1);
  h.reads.shift()(querySnapshot([]));
  await tick();
  assert.equal(h.listeners.at(-1).size, 0);
  stop();
});

function careHarness(profile, lead) {
  const pushes = [];
  const { POST } = loadModule('app/api/push/notify-care-history/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    '../../lib/auth': { verifyStaff: async () => ({ authorized: true, profile }) },
    '../../../../src/lib/crmAccess': access,
    '../../../../src/lib/serverSupabase': { createServiceRoleClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: '1', data: lead }, error: null }) }) }) }) }) },
    '../../../../src/lib/webPushServer': { reservePushEvent: async () => true, releasePushEvent: async () => {}, sendPushNotifications: async (payload, filters) => { pushes.push({ payload, filters }); return { sent: 1 }; } },
  });
  return { pushes, post: (body) => POST({ json: async () => body }) };
}
test('Nhân viên không thể thông báo về khách được giao cho người khác', async () => {
  const h = careHarness({ role: 'member', email: 'nv@example.com' }, { assignee: 'other@example.com', careHistory: [{ time: 123 }] });
  assert.equal((await h.post({ leadId: '1', historyTime: 123 })).status, 403);
  assert.equal(h.pushes.length, 0);
});
test('Biên tập viên cập nhật lịch sử đã lưu chỉ gửi thông báo cho admin', async () => {
  const h = careHarness({ role: 'editor', email: 'editor@example.com' }, { careHistory: [{ time: 123 }] });
  assert.equal((await h.post({ leadId: '1', historyTime: 123 })).status, 200);
  assert.equal(JSON.stringify(h.pushes[0].filters), JSON.stringify({ roles: ['admin'] }));
  assert.equal((await h.post({ leadId: '1', historyTime: 456 })).status, 409);
});
