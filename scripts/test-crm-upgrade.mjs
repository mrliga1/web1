import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import sanitizeHtml from 'sanitize-html';

const output = ts.transpileModule(readFileSync('src/lib/crmCsv.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
runInNewContext(output, { module, exports: module.exports });
const { createCrmCsv, escapeCrmCsvCell } = module.exports;

function loadSource(path, mocks = {}, globals = {}) {
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const sourceModule = { exports: {} };
  runInNewContext(compiled, {
    module: sourceModule, exports: sourceModule.exports,
    console: { error() {}, warn() {} }, ...globals,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error(`Chưa giả lập mô-đun ${name}`);
    },
  });
  return sourceModule.exports;
}

const utils = loadSource('src/lib/utils.ts', {}, { URL });
const access = loadSource('src/lib/crmAccess.ts');
const richHtml = loadSource('src/lib/sanitizeRichHtml.ts', { './utils': utils, 'sanitize-html': sanitizeHtml }, { URL });
const internalLinks = loadSource('src/lib/contextualInternalLinks.ts');
const readiness = loadSource('src/lib/searchReadiness.ts', { './utils': utils });

test('Adapter không tải SDK lúc nhập mô-đun hoặc gửi form tư vấn', async () => {
  let sdkLoads = 0;
  let reads = 0;
  const api = loadSource('src/firebase.ts', {
    './lib/utils': utils,
    './supabase': { get supabase() { sdkLoads++; return { from: () => ({ select: async () => { reads++; return { data: [], error: null }; } }) }; } },
  }, { window: {}, fetch: async () => ({ ok: true, json: async () => ({ id: 'local-test-only', trackingEligible: false }) }) });
  assert.equal(sdkLoads, 0);
  const result = await api.addDoc(api.collection(api.db, 'consultations'), { name: 'Khách kiểm thử' });
  assert.equal(result.id, 'local-test-only');
  assert.equal(sdkLoads, 0);
  await api.getDocs(api.collection(api.db, 'products'));
  assert.equal(reads, 1);
  assert.equal(sdkLoads, 1);
});

test('Đồng bộ công khai chỉ tải Realtime lúc rảnh và bỏ sự kiện sau khi rời trang', async () => {
  let effect;
  let idleCallback;
  let client;
  let refreshes = 0;
  let dispatched = 0;
  const callbacks = [];
  const timers = new Map();
  const channel = { on: (_event, filter, callback) => { callbacks.push({ filter, callback }); return channel; }, subscribe: () => channel };
  class RealtimeClient {
    constructor() { client = this; }
    channel() { return channel; }
    removeChannel() { this.removed = true; return Promise.resolve(); }
    disconnect() { this.disconnected = true; return Promise.resolve(); }
  }
  const component = loadSource('src/components/ContentRealtimeRefresh.tsx', {
    react: { useEffect: callback => { effect = callback; } },
    'next/navigation': { usePathname: () => '/', useRouter: () => ({ refresh: () => { refreshes++; } }) },
    '@supabase/realtime-js': { RealtimeClient },
  }, {
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://public.example.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJ-local-test' } },
    window: { requestIdleCallback: callback => { idleCallback = callback; return 1; }, cancelIdleCallback() {}, dispatchEvent: () => { dispatched++; } },
    CustomEvent: class { constructor(type) { this.type = type; } },
    setTimeout: (callback, delay) => { assert.equal(delay, 350); timers.set(1, callback); return 1; },
    clearTimeout: id => timers.delete(id),
  });
  component.default();
  const cleanup = effect();
  assert.equal(client, undefined);
  idleCallback();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(callbacks.length, 5);
  callbacks[0].callback();
  timers.get(1)();
  assert.equal(refreshes, 1);
  assert.equal(dispatched, 1);
  cleanup();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(client.removed, true);
  assert.equal(client.disconnected, true);
  callbacks[0].callback();
  assert.equal(refreshes, 1);
});

test('Liên kết bài đã gỡ giữ chữ, bài đổi tiêu đề dùng URL hiện tại, URL nhập nhầm không thành liên kết', () => {
  const html = '<p><a href="/tin-tuc/cu#gh-il-manual-news-n1">Bài thật</a> <a href="/tin-tuc/da-xoa#gh-il-manual-news-n2"><strong>Bài cũ</strong></a></p>';
  const result = internalLinks.resolveInternalLinkUrls(html, [{ type: 'news', id: 'n1', url: '/tin-tuc/moi' }]);
  assert.match(result, /href="\/tin-tuc\/moi"/);
  assert.match(result, /<strong>Bài cũ<\/strong>/);
  assert.ok(!result.includes('/da-xoa'));
  assert.equal(richHtml.sanitizeRichHtml('<a href="xvxcvcvbcdg">Chữ vẫn còn</a>'), '<span>Chữ vẫn còn</span>');
});

test('Nội dung thử nghiệm bị cảnh báo, nội dung có tiêu đề thật không bị loại do từ khóa thông thường', () => {
  assert.equal(readiness.isContentSearchReady({ title: 'text sản phẩm mới nhà phố' }), false);
  assert.equal(readiness.isContentSearchReady({ title: 'Kiểm tra bài viết mới' }), false);
  assert.equal(readiness.isContentSearchReady({ title: 'Dự án A', description: 'h'.repeat(30) }), false);
  assert.equal(readiness.isContentSearchReady({ title: 'Kiểm tra pháp lý trước khi mua nhà', description: 'Hướng dẫn đối chiếu hồ sơ có nguồn.' }), true);
});

test('HTML hiển thị chặn mã thực thi, URI mã hóa và iframe ngoài danh sách tin cậy', () => {
  const result = richHtml.sanitizeRichHtml('<p style="color:#03552a; background-image:url(javascript:x)">Nội dung <strong>thật</strong></p><a href="java&#x73;cript:alert(1)">Liên kết</a><img src="/uploads/a.webp" onerror="alert(1)"><script>alert(1)</script><iframe src="https://evil.example/" srcdoc="x"></iframe>');
  assert.ok(!/javascript:|onerror=|<script|srcdoc=|evil\.example|background-image/.test(result));
  assert.match(result, /<strong>thật<\/strong>/);
  assert.match(result, /color:#03552a/);
  assert.match(result, /alt=/);
  assert.match(richHtml.sanitizeRichHtml('<iframe src="https://www.google.com/maps/embed?x=1"></iframe>'), /www.google.com/);
  assert.match(richHtml.sanitizeRichHtml('<a href="https://example.com" target="_blank">Xem</a>'), /rel="noopener noreferrer"/);
});

function mailHarness(options = {}) {
  const sent = [];
  const client = { from: (table) => {
    const query = {
      select: () => query, eq: () => query, ilike: () => query,
      maybeSingle: async () => ({ data: table === 'consultations'
        ? { id: 'lead-a', data: { name: '<Khách>', phone: '0901234567', assignee: 'a@example.com', demand: '<script>x</script>' } }
        : options.staff === false ? null : { uid: 'a', email: 'a@example.com', role: 'member' }, error: null }),
    };
    return query;
  } };
  const route = loadSource('app/api/send-email/route.ts', {
    nodemailer: { createTransport: () => ({ sendMail: async (mail) => {
      if (options.smtpError) throw new Error('SMTP giả lập thất bại');
      sent.push(mail);
    }, close() {} }) },
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status || 200 }) } },
    '../lib/auth': { verifyStaff: async () => ({ authorized: options.authorized !== false, profile: { role: options.role || 'admin' } }) },
    '../../../src/lib/serverSupabase': { createServiceRoleClient: () => client },
    '../../../src/lib/crmAccess': access,
  }, { process: { env: { SMTP_USER: 'smtp@example.com', SMTP_PASS: 'fake-password' } } });
  return { sent, post: (body) => route.POST({ json: async () => body }) };
}

test('API email chỉ cho quản lý gửi đến nhân viên đúng với hồ sơ được giao', async () => {
  for (const options of [{ authorized: false }, { role: 'member' }]) {
    const h = mailHarness(options);
    assert.equal((await h.post({ leadId: 'lead-a', email: 'a@example.com' })).status, 403);
    assert.equal(h.sent.length, 0);
  }
  const mismatch = mailHarness();
  assert.equal((await mismatch.post({ leadId: 'lead-a', email: 'b@example.com' })).status, 409);
  assert.equal(mismatch.sent.length, 0);
  const unknown = mailHarness({ staff: false });
  assert.equal((await unknown.post({ leadId: 'lead-a', email: 'a@example.com' })).status, 409);
});

test('API email gửi đúng người, escape nội dung và trả lỗi thật khi SMTP thất bại', async () => {
  const h = mailHarness();
  assert.equal((await h.post({ leadId: 'lead-a', email: 'a@example.com' })).status, 200);
  assert.equal(h.sent[0].to, 'a@example.com');
  assert.match(h.sent[0].html, /&lt;Khách&gt;/);
  assert.ok(!h.sent[0].html.includes('<script>'));
  const failed = mailHarness({ smtpError: true });
  assert.equal((await failed.post({ leadId: 'lead-a', email: 'a@example.com' })).status, 503);
});

test('Đổi tiêu đề giữ URL cũ và các lần lưu sau không làm mất lịch sử URL', async () => {
  let row = { id: 'p1', data: { title: 'Nhà phố Quận 2', previousSlugs: ['nha-pho-cu'] } };
  const client = { from: () => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: row, error: null }),
      upsert: async (payload) => { row = payload; return { error: null }; },
      update: (payload) => ({ eq: async () => { row = { ...row, ...payload }; return { error: null }; } }),
    };
    return query;
  } };
  const api = loadSource('src/firebase.ts', { './supabase': { supabase: client }, './lib/utils': utils });
  await api.setDoc({ path: 'products', id: 'p1' }, { title: 'Nhà phố An Phú' });
  assert.deepEqual(Array.from(row.data.previousSlugs), ['nha-pho-cu', 'nha-pho-quan-2']);
  await api.setDoc({ path: 'products', id: 'p1' }, { title: 'Nhà phố An Phú', description: 'Đã cập nhật' });
  assert.deepEqual(Array.from(row.data.previousSlugs), ['nha-pho-cu', 'nha-pho-quan-2']);
  await api.updateDoc({ path: 'products', id: 'p1' }, { title: 'Nhà phố Quận 2' });
  assert.deepEqual(Array.from(row.data.previousSlugs), ['nha-pho-cu', 'nha-pho-an-phu']);
});

test('CSV giữ dấu ngoặc kép, xuống dòng và ngăn công thức từ dữ liệu khách', () => {
  assert.equal(escapeCrmCsvCell('Khách "A", B'), '"Khách ""A"", B"');
  for (const value of ['=HYPERLINK("x")', '+84901234567', '-1+1', '@SUM(A1)', '  =1+1', '\t=1']) {
    assert.ok(escapeCrmCsvCell(value).startsWith('"\''));
  }
  assert.equal(createCrmCsv(['Tên'], [['Khách\nA']]), '\uFEFF"Tên"\r\n"Khách\nA"');
});

test('Migration CRM thực thi trong PostgreSQL và giữ đúng quyền dữ liệu', async () => {
  const db = new PGlite();
  try {
    // Dùng dữ liệu giả và danh tính giả, không kết nối cơ sở dữ liệu production.
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth; create schema private;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      create table public.users (id uuid primary key, uid text unique, email text, role text, username text, phone text, avatarurl text);
      create table public.consultations (id text primary key, data jsonb);
      alter table public.consultations enable row level security;
      grant usage on schema public, auth, private to anon, authenticated;
      grant select, insert, update, delete on public.consultations to authenticated;
      grant insert on public.consultations to anon;
      grant select, insert, update, delete on public.users to authenticated;
      alter table public.users enable row level security;
      insert into users (id, uid, email, role) values
        ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','admin@example.com','admin'),
        ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','a@example.com','member'),
        ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','b@example.com','member'),
        ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004','editor@example.com','editor');
      insert into consultations values
        ('lead-a','{"status":"new","assignee":"a@example.com","careHistory":[]}'),
        ('lead-b','{"status":"new","assignee":"b@example.com","careHistory":[]}');
      insert into consultations
      select 'sample-' || i, jsonb_build_object('status', 'pending', 'assignee', 'b@example.com',
        'name', 'Khách mẫu ' || i, 'phone', '090100' || i, 'createdAt', '2026-09-01T00:00:00Z')
      from generate_series(1,26) i;
    `);
    const roleMigration = readFileSync('supabase/migrations/202609020001_enable_crm_realtime_roles.sql', 'utf8');
    // Schema đã đối chiếu với production: khóa users.id là UUID và vai trò đọc từ hồ sơ thật.
    const hardening = readFileSync('supabase/migrations/202607170002_harden_legacy_and_engagement.sql', 'utf8');
    await db.exec(hardening.split('do $')[0] + 'commit;');
    await db.exec(roleMigration.split('alter table public.consultations replica identity full;')[0] + 'commit;');
    const beforeRelease = (await db.query('select id, data from consultations order by id')).rows;
    // Kiểm tra đúng tệp giao dịch sẽ chạy trên Supabase, gồm đối soát trước và sau.
    const releaseResults = await db.exec(readFileSync('docs/performance-2026-09-29/AP-DUNG-CRM.sql', 'utf8'));
    assert.deepEqual(releaseResults.at(-1).rows[0].crm_release_status, {
      crm_migration_applied: true, lead_count: 28,
      query_rpc_exists: true, patch_rpc_exists: true, history_rpc_exists: true,
    });
    assert.deepEqual((await db.query('select id, data from consultations order by id')).rows, beforeRelease);
    await db.exec(`set role authenticated; set test.uid = '00000000-0000-0000-0000-000000000001'; set test.app_role = 'admin';`);

    const firstPage = (await db.query('select query_consultations() as result')).rows[0].result;
    const nextPage = (await db.query('select query_consultations(p_page => 2) as result')).rows[0].result;
    assert.equal(firstPage.rows.length, 25);
    assert.equal(nextPage.rows.length, 3);
    assert.equal(firstPage.total, 28);
    assert.equal(firstPage.stats.new, 28);
    assert.equal(new Set([...firstPage.rows, ...nextPage.rows].map(row => row.id)).size, 28);
    const searched = (await db.query('select query_consultations(p_search => $1) as result', ['Khách mẫu 26'])).rows[0].result;
    assert.equal(searched.total, 1);
    assert.equal(searched.rows[0].id, 'sample-26');
    assert.equal((await db.query('select query_consultations(p_search => $1) as result', ["') OR 1=1 --"])).rows[0].result.total, 0);
    await assert.rejects(db.query('select query_consultations(p_page_size => null)'), /không hợp lệ/);

    await Promise.all([
      db.query('select patch_consultation($1,$2::jsonb)', ['lead-a', JSON.stringify({ status: 'contacted' })]),
      db.query('select patch_consultation($1,$2::jsonb)', ['lead-a', JSON.stringify({ priority: 'high' })]),
    ]);
    const afterPatch = (await db.query('select data from consultations where id=$1', ['lead-a'])).rows[0].data;
    assert.equal(afterPatch.status, 'contacted');
    assert.equal(afterPatch.priority, 'high');
    assert.equal(afterPatch.assignee, 'a@example.com');
    await Promise.all(Array.from({ length: 12 }, (_, index) => db.query(
      'select append_consultation_care_history($1,$2)', ['lead-a', `Ghi chú ${index}`],
    )));
    const history = (await db.query('select data from consultations where id=$1', ['lead-a'])).rows[0].data.careHistory;
    assert.equal(history.length, 12);
    assert.equal(new Set(history.map(item => item.note)).size, 12);
    assert.ok(history.every(item => item.author === 'admin@example.com' && item.time > 0));
    assert.equal((await db.query('select * from consultation_activity')).rows.length, 2);
    // Bản cũ gửi username; máy chủ vẫn nhận ghi chú và giữ danh tính từ phiên thật.
    for (const author of ['Tên nhân viên của bản cũ', 'người-khác@example.com']) {
      await db.query("update consultations set data = jsonb_set(data, '{careHistory}', data->'careHistory' || $1::jsonb) where id=$2",
        [JSON.stringify([{ note: '  Ghi chú tương thích  ', time: Date.now(), author, forgedExtra: true }]), 'lead-a']);
    }
    const legacyHistory = (await db.query("select data->'careHistory' as history from consultations where id='lead-a'")).rows[0].history;
    assert.deepEqual(legacyHistory.slice(0, 12), history);
    assert.equal(legacyHistory.length, 14);
    assert.ok(legacyHistory.slice(12).every(item => item.author === 'admin@example.com' && item.note === 'Ghi chú tương thích' && !Object.hasOwn(item, 'forgedExtra')));

    await assert.rejects(db.query('select patch_consultation($1,$2::jsonb)', ['lead-a', '{"careHistory":[]}']), /không được phép/);
    await assert.rejects(db.query('select patch_consultation($1,$2::jsonb)', ['lead-a', '{"privacyAccepted":false}']), /không được phép/);
    await assert.rejects(db.query('select patch_consultation($1,$2::jsonb)', ['lead-a', '{"status":"fake"}']), /không hợp lệ/);
    await assert.rejects(db.query('select append_consultation_care_history($1,$2)', ['lead-a', ' ']), /không hợp lệ/);

    await db.exec(`set test.uid = '00000000-0000-0000-0000-000000000002'; set test.app_role = 'member';`);
    assert.deepEqual((await db.query('select id from consultations')).rows.map(row => row.id), ['lead-a']);
    const memberPage = (await db.query('select query_consultations() as result')).rows[0].result;
    assert.equal(memberPage.total, 1);
    assert.equal(memberPage.stats.total, 1);
    assert.equal(memberPage.rows[0].id, 'lead-a');
    await db.query('select patch_consultation($1,$2::jsonb)', ['lead-a', '{"status":"negotiating"}']);
    await assert.rejects(db.query('select patch_consultation($1,$2::jsonb)', ['lead-b', '{"status":"won"}']), /không có quyền/);
    await assert.rejects(db.query('select patch_consultation($1,$2::jsonb)', ['lead-a', '{"assignee":"b@example.com"}']), /Chỉ quản lý/);
    await assert.rejects(db.query("update consultations set data = data || '{\"privacyAccepted\":false}'::jsonb where id = 'lead-a'"), /không được phép/);
    await assert.rejects(db.query("update consultations set data = data || '{\"careHistory\":[]}'::jsonb where id = 'lead-a'"), /chỉ được thêm mới/);
    await assert.rejects(db.query("update consultations set data = jsonb_set(data, '{careHistory,0,note}', '\"Sửa ghi chú cũ\"') where id = 'lead-a'"), /chỉ được thêm mới/);
    await assert.rejects(db.query("update consultations set data = data || '{\"assignee\":\"Khác <a@example.com>\"}'::jsonb where id = 'lead-a'"), /Chỉ quản lý/);
    await db.query('select append_consultation_care_history($1,$2)', ['lead-a', 'Ghi chú nhân viên']);
    const memberHistory = (await db.query("select data->'careHistory' as history from consultations where id='lead-a'")).rows[0].history;
    assert.equal(memberHistory[memberHistory.length - 1].author, 'a@example.com');
    await assert.rejects(db.query('delete from consultation_activity'), /permission denied/);
    assert.ok((await db.query('select * from consultation_activity')).rows.every(row => row.lead_id === 'lead-a'));
    await db.exec(`set test.uid = '00000000-0000-0000-0000-000000000003';`);
    assert.equal((await db.query('select * from consultation_activity')).rows.length, 0);
    await db.exec("set test.uid = '00000000-0000-0000-0000-000000000004';");
    assert.equal((await db.query('select query_consultations() as result')).rows[0].result.total, 28);
    await db.query('select patch_consultation($1,$2::jsonb)', ['lead-b', '{"assignee":"a@example.com","priority":"medium"}']);
    assert.ok((await db.query("select * from consultation_activity where lead_id='lead-b'")).rows.length > 0);
    await db.exec("set test.uid = '00000000-0000-0000-0000-000000000099';");
    await assert.rejects(db.query('select query_consultations()'), /Không có quyền/);
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select id from consultations'), /permission denied/);
    await assert.rejects(db.query('select query_consultations()'), /permission denied/);
    await assert.rejects(db.query('select patch_consultation($1,$2::jsonb)', ['lead-a', '{"status":"won"}']), /permission denied/);
  } finally {
    await db.close();
  }
});
