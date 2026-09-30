import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync('src/components/ContentRealtimeRefresh.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const flush = async () => { for (let step = 0; step < 8; step++) await Promise.resolve(); };

function fixture(options = {}) {
  const browser = new EventTarget();
  const timers = new Map();
  const idleCallbacks = new Map();
  const calls = { imports: 0, clients: 0, subscriptions: 0, refreshes: 0, contentEvents: 0, removed: 0, disconnected: 0, warnings: [], tables: [] };
  let counter = 0;
  let effect;
  let change;
  let releaseImport;
  const delayedImport = new Promise(resolve => { releaseImport = resolve; });
  const channel = {
    on(event, filter, callback) { calls.tables.push(filter.table); change = callback; return channel; },
    subscribe(callback) { calls.subscriptions++; callback(options.channelError ? 'CHANNEL_ERROR' : 'SUBSCRIBED', options.channelError ? 'Lỗi kết nối giả lập' : undefined); },
  };
  class Client {
    constructor() { calls.clients++; }
    channel() { return channel; }
    removeChannel() { calls.removed++; return options.cleanupError ? Promise.reject(new Error('Lỗi dọn kết nối giả lập')) : Promise.resolve(); }
    disconnect() { calls.disconnected++; }
  }
  if (!options.noIdle) {
    browser.requestIdleCallback = callback => { const id = ++counter; idleCallbacks.set(id, callback); return id; };
    browser.cancelIdleCallback = id => idleCallbacks.delete(id);
  }
  browser.addEventListener('greenia:content-updated', () => calls.contentEvents++);
  const mod = { exports: {} };
  const context = {
    module: mod, exports: mod.exports, window: browser,
    document: { readyState: options.loading ? 'loading' : 'complete' },
    CustomEvent: class extends Event { constructor(type) { super(type); } },
    process: { env: options.missingConfig ? {} : { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJfixture' } },
    console: { warn: (...args) => calls.warnings.push(args), error: (...args) => calls.warnings.push(args) },
    setTimeout(callback, delay) { assert.ok(delay <= 60000); const id = ++counter; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    require(name) {
      if (name === 'react') return { useEffect(callback) { effect = callback; } };
      if (name === 'next/navigation') return { usePathname: () => options.admin ? '/admin' : '/', useRouter: () => ({ refresh() { calls.refreshes++; } }) };
      if (name === '@supabase/realtime-js') {
        calls.imports++;
        if (options.importError) throw new Error('Lỗi tải thư viện giả lập');
        return options.delayedImport ? delayedImport : { RealtimeClient: Client };
      }
      throw new Error('Phụ thuộc ngoài phạm vi kiểm thử: ' + name);
    },
  };
  vm.runInNewContext(compiled, context);
  mod.exports.default();
  const cleanup = effect();
  return {
    calls, timers, idleCallbacks, cleanup,
    event(type) { browser.dispatchEvent(new Event(type)); },
    load() { context.document.readyState = 'complete'; browser.dispatchEvent(new Event('load')); },
    tick(delay) { for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.callback(); } },
    idle() { for (const [id, callback] of [...idleCallbacks]) { idleCallbacks.delete(id); callback(); } },
    changed() { change(); },
    release() { releaseImport({ RealtimeClient: Client }); },
  };
}

let passed = 0;
async function check(name, callback) { await callback(); passed++; console.log('Đạt: ' + name); }

await check('chờ tải trang, ưu tiên tương tác và không kết nối trùng', async () => {
  const f = fixture({ loading: true });
  f.event('pointerdown');
  assert.equal(f.calls.imports, 0);
  assert.equal(f.idleCallbacks.size, 0);
  f.load();
  assert.equal(f.idleCallbacks.size, 1);
  f.event('keydown'); f.event('scroll');
  assert.equal(f.idleCallbacks.size, 1);
  f.idle(); await flush();
  assert.equal(f.calls.clients, 1);
  assert.equal(f.calls.subscriptions, 1);
  assert.deepEqual(f.calls.tables, ['products', 'projects', 'news', 'settings', 'layouts']);
  f.changed(); f.changed(); f.tick(350);
  assert.equal(f.calls.refreshes, 1);
  assert.equal(f.calls.contentEvents, 1);
  f.cleanup(); await flush();
  assert.equal(f.calls.removed, 1);
  assert.equal(f.calls.disconnected, 1);
});

await check('khách chỉ đọc được kết nối sau 5 giây và thời gian rảnh', async () => {
  const f = fixture();
  assert.equal(f.calls.imports, 0);
  assert.equal(f.idleCallbacks.size, 0);
  assert.equal([...f.timers.values()][0].delay, 5000);
  f.tick(5000);
  assert.equal(f.calls.imports, 0);
  f.idle(); await flush();
  assert.equal(f.calls.clients, 1);
  f.cleanup(); await flush();
});

await check('hủy trước tải trang không tạo kết nối', async () => {
  const f = fixture({ loading: true });
  f.event('pointerdown'); f.cleanup(); f.load(); f.event('keydown'); f.tick(5000); f.idle(); await flush();
  assert.equal(f.calls.imports, 0);
  assert.equal(f.timers.size, 0);
});

await check('hủy khi đang chờ idle không tải thư viện', async () => {
  const f = fixture();
  f.event('scroll');
  assert.equal(f.idleCallbacks.size, 1);
  f.cleanup(); f.idle(); f.tick(5000); await flush();
  assert.equal(f.calls.imports, 0);
  assert.equal(f.idleCallbacks.size, 0);
});

await check('kết quả tải thư viện đến sau chuyển trang được bỏ qua', async () => {
  const f = fixture({ delayedImport: true });
  f.event('keydown'); f.idle(); await flush();
  assert.equal(f.calls.imports, 1);
  f.cleanup(); f.release(); await flush();
  assert.equal(f.calls.clients, 0);
});

await check('trình duyệt thiếu requestIdleCallback vẫn đồng bộ', async () => {
  const f = fixture({ noIdle: true });
  f.event('pointerdown');
  assert.equal(f.calls.imports, 0);
  f.tick(0); await flush();
  assert.equal(f.calls.clients, 1);
  f.cleanup(); await flush();
});

await check('trang quản trị không khởi tạo đồng bộ công khai', async () => {
  const f = fixture({ admin: true });
  f.event('pointerdown'); f.load(); f.tick(5000); f.idle(); await flush();
  assert.equal(f.cleanup, undefined);
  assert.equal(f.calls.imports, 0);
  assert.equal(f.timers.size, 0);
});

await check('thiếu cấu hình được xử lý và không tạo client', async () => {
  const f = fixture({ missingConfig: true });
  f.event('pointerdown'); f.idle(); await flush();
  assert.equal(f.calls.clients, 0);
  assert.equal(f.calls.warnings.length, 1);
  f.cleanup();
});

await check('lỗi tải thư viện được xử lý', async () => {
  const f = fixture({ importError: true });
  f.event('pointerdown'); f.idle(); await flush();
  assert.equal(f.calls.clients, 0);
  assert.equal(f.calls.warnings.length, 1);
  f.cleanup();
});

await check('lỗi channel và dọn channel vẫn ngắt kết nối', async () => {
  const f = fixture({ channelError: true, cleanupError: true });
  f.event('pointerdown'); f.idle(); await flush();
  assert.equal(f.calls.warnings.length, 1);
  f.cleanup(); await flush();
  assert.equal(f.calls.disconnected, 1);
  assert.equal(f.calls.warnings.length, 2);
});

console.log('Kiểm thử đồng bộ nền: ' + passed + '/10 đạt.');
