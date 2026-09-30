import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const choiceCode = compile('src/lib/cookieConsentChoice.ts');
const componentCode = compile('src/components/CookieConsent.tsx');

function fixture({ stored = null, blocked = false, enabled = true, pathname = '/', server = false } = {}) {
  const attributes = new Map();
  const calls = { reads: 0, writes: [], tracking: [], events: [] };
  const localStorage = {
    getItem() { calls.reads++; if (blocked) throw new Error('Lưu trữ bị chặn'); return stored; },
    setItem(key, value) { calls.writes.push([key, value]); if (blocked) throw new Error('Lưu trữ bị chặn'); stored = value; },
  };
  const document = { documentElement: {
    getAttribute: key => attributes.get(key) ?? null,
    setAttribute: (key, value) => attributes.set(key, value),
  } };
  const sandbox = {
    module: { exports: {} }, exports: {},
    document: server ? undefined : document,
    localStorage: server ? undefined : localStorage,
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(choiceCode, sandbox);
  const choice = sandbox.module.exports;
  let state;
  let effect;
  const hooks = { ...React,
    useState(initial) { if (state === undefined) state = initial; return [state, value => { state = value; }]; },
    useEffect(callback) { effect = callback; },
  };
  const mod = { exports: {} };
  vm.runInNewContext(componentCode, {
    module: mod, exports: mod.exports,
    window: { dispatchEvent: event => calls.events.push(event.detail) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'lucide-react') return { Cookie: props => React.createElement('svg', props) };
      if (name === 'next/link') return props => React.createElement('a', { href: props.href }, props.children);
      if (name === 'next/navigation') return { usePathname: () => pathname };
      if (name === '../contexts/AppContext') return { useAppContext: () => ({ cookieConsentEnabled: enabled }) };
      if (name === '../lib/tracking') return { setTrackingConsent: value => calls.tracking.push(value) };
      if (name === '../lib/cookieConsentChoice') return choice;
      throw new Error('Phụ thuộc ngoài phạm vi kiểm thử: ' + name);
    },
    setTimeout() { throw new Error('Thông báo không được đợi bộ hẹn giờ'); },
  });
  const render = () => mod.exports.default();
  return { calls, attributes, choice, render, html: () => renderToStaticMarkup(render()), mount() { render(); effect(); }, bootstrap() { vm.runInNewContext(choice.COOKIE_CHOICE_BOOTSTRAP, sandbox); } };
}

function buttons(tree) {
  const found = [];
  const visit = node => {
    if (!React.isValidElement(node)) return;
    if (node.type === 'button') found.push(node);
    React.Children.forEach(node.props.children, visit);
  };
  visit(tree);
  return found;
}

let passed = 0;
function check(name, callback) { callback(); passed++; console.log('Đạt: ' + name); }

check('khách mới có thông báo ngay trong HTML máy chủ', () => {
  const f = fixture({ server: true });
  assert.match(f.html(), /role="alertdialog"/);
  assert.doesNotMatch(f.html(), /animate-in|fade-in|slide-in-from-bottom/);
  assert.equal(f.calls.reads, 0);
});

for (const options of [{ pathname: '/admin/consultations' }, { enabled: false }]) {
  check('ẩn thông báo theo cấu hình hoặc trang quản trị', () => {
    const f = fixture(options);
    assert.equal(f.html(), ''); f.mount(); assert.equal(f.html(), '');
    assert.equal(f.calls.reads, 0);
  });
}

for (const stored of ['accepted', 'declined']) {
  check('ghi nhớ lựa chọn ' + stored + ' trước khi vẽ và sau khởi tạo', () => {
    const f = fixture({ stored }); f.bootstrap();
    assert.equal(f.attributes.get('data-greenia-cookie-choice'), stored);
    f.mount(); assert.equal(f.html(), '');
    assert.deepEqual(f.calls.tracking, []);
  });
}

check('dữ liệu lưu không hợp lệ không ẩn yêu cầu lựa chọn', () => {
  const f = fixture({ stored: 'unknown' }); f.bootstrap(); f.mount();
  assert.equal(f.attributes.size, 0);
  assert.match(f.html(), /role="alertdialog"/);
});

for (const blocked of [false, true]) {
  for (const [index, choice, tracking] of [[0, 'accepted', 'granted'], [1, 'declined', 'denied']]) {
    check('nút ' + choice + ', lưu trữ bị chặn: ' + blocked, () => {
      const f = fixture({ blocked }); f.bootstrap(); f.mount();
      buttons(f.render())[index].props.onClick();
      assert.equal(f.html(), '');
      assert.equal(f.choice.readCookieConsentChoice(), choice);
      assert.deepEqual(f.calls.tracking, [tracking]);
      assert.deepEqual(f.calls.events.map(event => event.status), [choice]);
      // Mô phỏng hiệu ứng chạy lại sau chuyển trang, không hỏi lại trong phiên.
      f.mount(); assert.equal(f.html(), '');
    });
  }
}

check('head và CSS dùng cùng thuộc tính để tránh hiện lại thông báo đã xử lý', () => {
  const f = fixture({ stored: 'declined' }); f.bootstrap();
  assert.match(readFileSync('app/layout.tsx', 'utf8'), /__html: COOKIE_CHOICE_BOOTSTRAP/);
  assert.match(readFileSync('src/index.css', 'utf8'), /html\[data-greenia-cookie-choice\] \.cookie-consent-banner\s*\{\s*display: none;/);
});

console.log('Kiểm thử thông báo cookie: ' + passed + '/11 đạt.');
