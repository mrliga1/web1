import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
function load(code, dependencies, globals = {}) {
  const evaluatedModule = { exports: {} };
  vm.runInNewContext(code, { module: evaluatedModule, exports: evaluatedModule.exports, require: name => name === "react/jsx-runtime" ? require(name) : dependencies(name), ...globals });
  return evaluatedModule.exports;
}
const layouts = load(compile('src/lib/layouts.ts'), name => { throw new Error('Phụ thuộc ngoài phạm vi: ' + name); });
const utils = load(compile('src/lib/layoutUtils.ts'), name => { throw new Error('Phụ thuộc ngoài phạm vi: ' + name); });
const providerCode = compile('src/contexts/AppContext.tsx');
const same = (actual, expected) => assert.equal(JSON.stringify(actual), JSON.stringify(expected));

function fixture(path = '/') {
  let pathname = path;
  let cursor = 0;
  let effectCursor = 0;
  const slots = [];
  const effects = [];
  const calls = { layouts: 0, saves: [], alerts: [], errors: [] };
  const flags = { failLayout: false, failSave: false };
  const hooks = { ...React,
    useState(initial) {
      const slot = cursor++;
      if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial;
      return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
    },
    useRef(initial) {
      const slot = cursor++;
      if (!(slot in slots)) slots[slot] = { current: initial };
      return slots[slot];
    },
    useEffect(callback, dependencies) {
      const slot = effectCursor++;
      const previous = effects[slot];
      const changed = !previous || dependencies.length !== previous.dependencies.length || dependencies.some((value, index) => !Object.is(value, previous.dependencies[index]));
      effects[slot] = { callback, dependencies, changed, cleanup: previous?.cleanup };
    },
  };
  const exports = load(providerCode, name => {
    if (name === 'react') return hooks;
    if (name === 'next/navigation') return { usePathname: () => pathname };
    if (name === '../lib/layoutUtils') return utils;
    if (name === '../lib/utils') return { optimizeImageUrl: value => value };
    if (name === '../hooks/useManualIpTrackingPolicy') return { useManualIpTrackingPolicy() {} };
    if (name === '../lib/tracking') return {};
    if (name === '../lib/layouts') {
      calls.layouts++;
      if (flags.failLayout) throw new Error('Không tải được cấu hình');
      return layouts;
    }
    if (name === '../firebase') return { db: {}, doc: (db, table, id) => ({ table, id }), async setDoc(reference, data) {
      if (flags.failSave) throw new Error('Thiếu quyền lưu');
      calls.saves.push({ reference, data });
    } };
    throw new Error('Phụ thuộc ngoài phạm vi: ' + name);
  }, { alert: message => calls.alerts.push(message), console: { error: (...args) => calls.errors.push(args) }, process: { env: {} } });
  function render() {
    cursor = 0; effectCursor = 0;
    return exports.AppProvider({ children: null, initialSettings: { quotePopupEnabled: false, quotePopupVersion: 1, adSenseSettings: { enabled: false }, cookieConsentEnabled: true } }).props.value;
  }
  function flushLayout() {
    const effect = effects[0];
    if (!effect.changed) return;
    effect.cleanup?.();
    effect.cleanup = effect.callback();
    effect.changed = false;
  }
  return { render, flushLayout, calls, flags, route(value) { pathname = value; } };
}
const settle = async () => { for (let i = 0; i < 3; i++) await new Promise(setImmediate); };
let passed = 0;
async function check(name, callback) { await callback(); passed++; console.log('Đạt: ' + name); }

await check('khách công khai không tải thư viện mẫu và không ghi cơ sở dữ liệu', async () => {
  for (const path of ['/', '/san-pham', '/du-an', '/tin-tuc', '/lien-he', '/admin']) {
    const f = fixture(path);
    same(f.render().sections, []); f.flushLayout(); await settle();
    assert.equal(f.calls.layouts, 0); assert.equal(f.calls.saves.length, 0);
  }
});

await check('chế độ chỉnh sửa vẫn nhận mẫu đầy đủ cho cả năm trang', async () => {
  for (const [path, doc] of [['/', 'home'], ['/san-pham', 'san-pham'], ['/du-an', 'du-an'], ['/tin-tuc', 'tin-tuc'], ['/lien-he', 'lien-he']]) {
    const f = fixture(path);
    f.render().setIsEditMode(true); f.render(); f.flushLayout(); await settle();
    const expected = doc === 'home' ? utils.sanitizeHomeSections(layouts.getPageDefaultSections(doc)) : layouts.getPageDefaultSections(doc);
    assert.ok(expected.length > 0); same(f.render().sections, expected);
    assert.equal(f.calls.layouts, 1); assert.equal(f.calls.saves.length, 0);
  }
});

await check('bố cục máy chủ và chỉnh sửa hiện tại được giữ khi mẫu tải xong', async () => {
  const f = fixture('/');
  f.render().setIsEditMode(true); f.render(); f.flushLayout();
  const saved = [{ id: 'hero', title: 'Banner đã cấu hình', visible: true }, { id: 'news', visible: true }];
  await f.render().setSections(saved); await settle();
  same(f.render().sections, saved);
  assert.equal(f.calls.saves[0].reference.id, 'home');
});

await check('chuyển trang không dùng bố cục cũ hoặc áp dụng kết quả tải đã hủy', async () => {
  const f = fixture('/du-an');
  f.render().setIsEditMode(true); f.render(); f.flushLayout();
  f.route('/tin-tuc'); same(f.render().sections, []); f.flushLayout(); await settle();
  same(f.render().sections, layouts.getPageDefaultSections('tin-tuc'));
  f.route('/admin'); same(f.render().sections, []); f.flushLayout();
  assert.equal(f.calls.saves.length, 0);
});

await check('cập nhật bằng hàm và bảng vẫn lưu đúng định dạng dữ liệu', async () => {
  const f = fixture('/san-pham');
  f.render().setIsEditMode(true); f.render(); f.flushLayout(); await settle();
  const originalCount = f.render().sections.length;
  await f.render().setSections(previous => [...previous, { id: 'custom', visible: true, extraData: { elements: [{ type: 'table', tableData: { rows: [['A', 'B']] } }] } }]);
  assert.equal(f.render().sections.length, originalCount + 1);
  same(f.calls.saves[0].data.sections.at(-1).extraData.elements[0].tableData.rows, [{ cols: ['A', 'B'] }]);
});

await check('lỗi tải hoặc thiếu quyền lưu được báo, bản sửa trong phiên vẫn được giữ', async () => {
  const f = fixture('/san-pham'); f.flags.failLayout = true;
  f.render().setIsEditMode(true); f.render(); f.flushLayout(); await settle();
  assert.equal(f.calls.alerts.length, 1); assert.equal(f.calls.errors.length, 1);
  f.flags.failSave = true;
  const saved = [{ id: 'products', visible: true, title: 'Bản sửa trong phiên' }];
  await f.render().setSections(saved);
  same(f.render().sections, saved);
  assert.equal(f.calls.alerts.length, 2); assert.equal(f.calls.errors.length, 2);
});

await check('cả bảy thành phần trang xuất HTML từ bố cục máy chủ khi context chưa có mẫu', () => {
  const initialSections = [{ id: 'custom', title: 'Nội dung máy chủ đã cấu hình', visible: true }];
  const hooks = { ...React, useState: value => [value, () => undefined], useEffect() {}, useMemo: callback => callback(), useRef: value => ({ current: value }) };
  const pageComponent = props => React.createElement('h2', null, props.sections[0]?.title);
  for (const path of ['app/HomePageClient.tsx', 'app/san-pham/ClientWrapper.tsx', 'app/du-an/ClientWrapper.tsx', 'app/tin-tuc/ClientWrapper.tsx', 'app/category-product/[name]/ClientWrapper.tsx', 'app/category-news/[name]/ClientWrapper.tsx', 'app/lien-he/ContactPageClient.tsx']) {
    const page = load(compile(path), name => {
      if (name === 'react') return hooks;
      if (name === 'next/navigation') return { useRouter: () => ({ push() {} }) };
      if (name.endsWith('/contexts/AppContext')) return { useAppContext: () => ({ sections: [], setSections() {}, isEditMode: false }) };
      if (name.endsWith('/contexts/NotificationContext')) return { useNotification: () => () => undefined };
      if (name.endsWith('/lib/utils')) return { getRouteUrl: () => '/' };
      if (/\/components\//.test(name)) return pageComponent;
      throw new Error('Phụ thuộc ngoài phạm vi: ' + name);
    });
    const html = renderToStaticMarkup(React.createElement(page.default, { initialSections, initialProducts: [], initialProjects: [], initialNews: [], needsClientRefresh: false, initialGeneralSettings: {}, initialFilterSettings: {}, initialCategoryLayout: 'grid', categoryName: 'Nhà phố' }));
    assert.match(html, /Nội dung máy chủ đã cấu hình/, path);
  }
});

console.log('Kiểm thử khởi tạo bố cục: ' + passed + '/7 đạt.');
