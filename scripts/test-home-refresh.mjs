import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

// Chạy component Home thật trong React; chỉ thay phần trình bày và chặn mạng bên ngoài.
const runtime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__home_test.cjs'));
const { chromium } = runtime('playwright');
const source = readFileSync('src/components/Home.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, timeout: 60000 });
try {
  const page = await browser.newPage();
  await page.route('**/*', route => route.abort());
  await page.setContent('<div id="fixture"></div>');
  await page.addScriptTag({ path: resolve('node_modules/react/umd/react.development.js') });
  await page.addScriptTag({ path: resolve('node_modules/react-dom/umd/react-dom.development.js') });
  await page.evaluate(compiled => {
    const React = window.React;
    const ReactDOM = window.ReactDOM;
    const renderers = {
      FeaturedListingsBody: props => React.createElement('p', { id: 'products' }, props.currentDisplayedProducts.map(item => item.title).join('|')),
      ProjectsBody: props => React.createElement('p', { id: 'projects' }, props.projects.map(item => item.title).join('|')),
      NewsBody: props => React.createElement('p', { id: 'news' }, props.news.map(item => item.title).join('|')),
    };
    const noop = () => null;
    const modules = { react: React, './HomeSectionRenderers': renderers };
    const moduleExports = {};
    new Function('require', 'exports', compiled)(name => modules[name] || noop, moduleExports);
    window.HomeFixture = { Home: moduleExports.default, root: ReactDOM.createRoot(document.getElementById('fixture')), React, ReactDOM };
    window.homeFetchCalls = 0;
    window.fetch = async () => { window.homeFetchCalls++; throw new Error('Mạng giả bị ngắt'); };
  }, compiled);
  const render = async (suffix, refreshOnMount = false) => page.evaluate(({ suffix, refreshOnMount }) => {
    const { Home, root, React, ReactDOM } = window.HomeFixture;
    const sections = ['featured_listings', 'projects', 'news'].map(id => ({ id, visible: true, paddingTop: 0, paddingBottom: 0 }));
    ReactDOM.flushSync(() => root.render(React.createElement(Home, {
      sections, isEditMode: false, selectedSectionId: null, setSelectedSectionId: () => {}, onNavigate: () => {}, onShowNotification: () => {}, onUpdateSections: () => {},
      initialProducts: [{ id: 'product', title: 'Sản phẩm ' + suffix }],
      initialProjects: [{ id: 'project', title: 'Dự án ' + suffix }],
      initialNews: [{ id: 'news', title: 'Tin tức ' + suffix }], refreshOnMount,
    })));
  }, { suffix, refreshOnMount });
  await render('cũ');
  assert.equal(await page.locator('#products').textContent(), 'Sản phẩm cũ');
  await render('mới');
  assert.equal(await page.locator('#products').textContent(), 'Sản phẩm mới');
  assert.equal(await page.locator('#projects').textContent(), 'Dự án mới');
  assert.equal(await page.locator('#news').textContent(), 'Tin tức mới');
  assert.equal(await page.evaluate(() => window.homeFetchCalls), 0);
  await page.evaluate(() => window.HomeFixture.root.unmount());
  await page.evaluate(() => { window.HomeFixture.root = window.ReactDOM.createRoot(document.getElementById('fixture')); });
  await render('dự phòng', true);
  await page.waitForFunction(() => window.homeFetchCalls === 1);
  assert.equal(await page.locator('#products').textContent(), 'Sản phẩm dự phòng');
  const results = ['Ba danh sách nhận snapshot mới khi component không bị tháo', 'Dữ liệu SSR đầy đủ không bị gọi lại qua API', 'Giữ nội dung dự phòng khi API làm mới bị lỗi'];
  const output = resolve('docs/performance-2026-09-29');
  mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, 'home-refresh-results.json'), JSON.stringify({ passed: true, presentationMocked: true, externalNetworkBlocked: true, results }, null, 2));
  console.log(JSON.stringify(results));
} finally {
  let timer;
  try { await Promise.race([browser.close(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Quá thời gian đóng trình duyệt kiểm thử')), 30000); })]); }
  finally { clearTimeout(timer); }
}
