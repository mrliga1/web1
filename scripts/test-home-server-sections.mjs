import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
function load(source, dependencies, globals = {}) {
  const evaluatedModule = { exports: {} };
  vm.runInNewContext(compile(source), { module: evaluatedModule, exports: evaluatedModule.exports, require: name => name === 'react/jsx-runtime' ? require(name) : dependencies(name), console, ...globals });
  return evaluatedModule.exports;
}
const file = path => readFileSync(path, 'utf8');
const previous = path => execFileSync('git', ['show', '9dc4f2cb93a987d2edf70a706719f72f2d233d1d:' + path], { encoding: 'utf8' });
const utils = load(file('src/lib/utils.ts'), name => { throw new Error(name); });
const normalization = load(file('src/lib/editableTextValue.ts'), name => { throw new Error(name); });
const layouts = load(file('src/lib/layouts.ts'), name => { throw new Error(name); });
const validations = load(file('src/lib/consultationValidation.ts'), name => { throw new Error(name); });
function Link({ children, ...props }) { delete props.prefetch; return React.createElement('a', props, children); }
const icons = new Proxy({}, { get: (_, name) => props => React.createElement('svg', { ...props, 'data-icon': name }) });
const editor = props => React.createElement('span', { 'data-editor': props.field }, props.value);
const editable = load(file('src/components/EditableComponent.tsx'), name => {
  if (name === 'next/dynamic') return () => editor;
  if (name === '../lib/editableTextValue') return normalization;
  if (name === 'react') return React;
  throw new Error(name);
});
const dependencies = name => {
  if (name === 'react') return React;
  if (name === 'next/link') return Link;
  if (name === 'lucide-react') return icons;
  if (name === '../lib/utils') return utils;
  if (name === './EditableComponent') return editable;
  if (name === './ProductCard') return function ProductFixture({ item }) { return React.createElement('article', { 'data-product': item.id }, item.title); };
  if (name === '../lib/tracking') return { trackLead() {} };
  if (name === './FormConsentFields') return function ConsentFixture() { return React.createElement('div', { 'data-consent': true }); };
  if (name === '../lib/consultationValidation') return validations;
  throw new Error('Phụ thuộc ngoài phạm vi: ' + name);
};
const baselineBodies = load(previous('src/components/HomeSectionRenderers.tsx'), dependencies);
const currentBodies = load(file('src/components/HomeSectionRenderers.tsx'), dependencies);
const staticBodies = load(file('src/components/HomeStaticSectionBodies.tsx'), dependencies);
const loaded = [];
const lazyLoaders = [];
function homeDependencies(bodies) {
  return name => {
    if (name === './HomeSectionRenderers') return bodies;
    if (name === './HomeStaticSectionBodies') return staticBodies;
    if (name === 'next/dynamic') return loader => {
      lazyLoaders.push(loader);
      const componentName = loader.toString().match(/module\.(\w+)/)?.[1];
      assert.ok(componentName, 'Phải xác định được khối tải theo nhu cầu');
      return function LazyBody(props) { loaded.push(componentName); return React.createElement(staticBodies[componentName], props); };
    };
    if (name === './CustomSectionRenderer') return function CustomFixture({ section }) { return React.createElement('aside', { 'data-custom': section.id }, section.title); };
    if (name === './SectionHeaderToolbar') return function ToolbarFixture({ section }) { return React.createElement('nav', { 'data-toolbar': section.id }); };
    if (name === './AdBanner') return () => null;
    return dependencies(name);
  };
}
const baselineHome = load(previous('src/components/Home.tsx'), homeDependencies(baselineBodies)).default;
const currentHome = load(file('src/components/Home.tsx'), homeDependencies(currentBodies)).default;
const sections = layouts.getPageDefaultSections('home');
const products = Array.from({ length: 15 }, (_, i) => ({ id: 'product-' + i, title: 'Sản phẩm ' + i }));
const projects = Array.from({ length: 7 }, (_, i) => ({ id: 'project-' + i, title: 'Dự án ' + i, imageUrl: '/du-an-' + i + '.webp', priceText: '5 tỷ', status: ['handed_over', 'coming_soon', 'selling'][i % 3], scale: '10 ha', units: 500, location: 'TP. Hồ Chí Minh' }));
const news = Array.from({ length: 7 }, (_, i) => ({ id: 'news-' + i, title: 'Tin tức ' + i, imageUrl: '/tin-tuc-' + i + '.webp', createdAt: '2026-09-30T18:30:00Z', description: 'Mô tả ' + i }));
const base = { heroBanner: React.createElement('h1', null, 'Banner từ máy chủ'), onNavigate() {}, onShowNotification() {}, isEditMode: false, sections, onUpdateSections() {}, selectedSectionId: null, setSelectedSectionId() {}, initialProducts: products, initialProjects: projects, initialNews: news, refreshOnMount: false };
const html = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
function normalizeLinks(value, href) {
  return value.replace(/<button type="button" class="(text-primary hover:text-primary font-sans[^"]+)">Xem thêm ([\s\S]*?)<\/button>/g, (_, className, content) => '<a href="' + href + '" class="' + className + '">Xem thêm ' + content + '</a>');
}
function assertMarkup(actual, expected) {
  if (actual === expected) return;
  let i = 0;
  while (i < Math.min(actual.length, expected.length) && actual[i] === expected[i]) i++;
  throw new Error('HTML khác tại vị trí ' + i + ': ' + JSON.stringify({ actual: actual.slice(Math.max(0, i - 80), i + 200), expected: expected.slice(Math.max(0, i - 80), i + 200), actualLength: actual.length, expectedLength: expected.length }));
}
const normalizeHome = value => value.replace(/<button type="button" class="(text-primary hover:text-primary font-sans[^"]+)">Xem thêm ([\s\S]*?)<\/button>/g, (match, className, content, offset) => {
  const context = value.slice(0, offset);
  const enclosingSection = context.slice(context.lastIndexOf('<section')).split('>')[0];
  const href = enclosingSection.includes('id="home-swiper-news"') ? '/tin-tuc' : enclosingSection.includes('id="home-swiper-projects"') ? '/du-an' : null;
  if (!href) return match;
  return '<a href="' + href + '" class="' + className + '">Xem thêm ' + content + '</a>';
});
let passed = 0;
async function check(name, callback) { await callback(); passed++; console.log('Đạt: ' + name); }

await check('bốn khối giữ nguyên HTML cho nội dung mặc định, nội dung sửa và các danh sách', () => {
  for (const [id, component, href] of [['corporate_intro', 'CorporateIntroBody'], ['reasons', 'ReasonsBody'], ['projects', 'ProjectsBody', '/du-an'], ['news', 'NewsBody', '/tin-tuc']]) {
    for (const count of [0, 1, 4, 7]) for (const customized of [false, true]) {
      const sec = { ...sections.find(s => s.id === id), ...(customized ? { title: 'Tiêu đề mới [gradient]nổi bật[/gradient]', description: 'Dòng 1\nDòng 2', extraData: { visionTitle: 'Tầm nhìn mới', stat1Val: '800+' } } : {}) };
      const props = { sec, sections, isEditMode: false, onUpdateSections() {}, onNavigate() {}, projects: projects.slice(0, count), news: news.slice(0, count) };
      const previousHtml = html(baselineBodies[component], props);
      assertMarkup(html(staticBodies[component], props), href ? normalizeLinks(previousHtml, href) : previousHtml);
    }
  }
});

await check('bố cục đầy đủ, khối ẩn và khối tùy chỉnh vẫn giữ thứ tự và nội dung', () => {
  for (const list of [sections, [...sections].reverse(), sections.map(s => s.id === 'reasons' ? { ...s, visible: false } : s), [...sections, { id: 'custom_banner_promo_1', title: 'Nội dung riêng', visible: true, paddingTop: 20, paddingBottom: 20 }]]) {
    const serverStaticSections = staticBodies.createHomeStaticSectionContent(list, projects, news);
    loaded.length = 0;
    assertMarkup(html(currentHome, { ...base, sections: list, serverStaticSections }), normalizeHome(html(baselineHome, { ...base, sections: list })));
    assert.equal(loaded.length, 0, 'Khách công khai không cần tải các module khối tĩnh');
  }
});

await check('bật chỉnh sửa dùng đúng khối và callback, không hiển thị bản chụp cũ', async () => {
  const serverStaticSections = staticBodies.createHomeStaticSectionContent(sections, projects, news);
  loaded.length = 0;
  assertMarkup(html(currentHome, { ...base, isEditMode: true, serverStaticSections }), normalizeHome(html(baselineHome, { ...base, isEditMode: true })));
  assert.deepEqual(loaded, ['CorporateIntroBody', 'ReasonsBody', 'ProjectsBody', 'NewsBody']);
  assert.equal(lazyLoaders.length, 4);
  for (const loader of lazyLoaders) assert.equal(typeof await loader(), 'function');
});

await check('sau chỉnh sửa, chỉ khối thay đổi dùng nội dung mới thay cho bản chụp máy chủ', () => {
  const serverStaticSections = staticBodies.createHomeStaticSectionContent(sections, projects, news);
  const modified = sections.map(s => s.id === 'corporate_intro' ? { ...s, title: 'Giới thiệu vừa chỉnh sửa' } : s);
  loaded.length = 0;
  const result = html(currentHome, { ...base, sections: modified, serverStaticSections });
  assertMarkup(result, normalizeHome(html(baselineHome, { ...base, sections: modified })));
  assert.match(result, /Giới thiệu vừa chỉnh sửa/);
  assert.deepEqual(loaded, ['CorporateIntroBody']);
});

await check('làm mới máy chủ dựng tin/dự án mới và bỏ bản chụp của khối đã ẩn', () => {
  const refreshed = sections.map(s => s.id === 'reasons' ? { ...s, visible: false } : s);
  const updatedProjects = [{ ...projects[0], title: 'Dự án cập nhật' }];
  const updatedNews = [{ ...news[0], title: 'Tin tức cập nhật' }];
  const slots = staticBodies.createHomeStaticSectionContent(refreshed, updatedProjects, updatedNews);
  assert.equal(slots.reasons, undefined);
  const result = html(currentHome, { ...base, sections: refreshed, initialProjects: updatedProjects, initialNews: updatedNews, serverStaticSections: slots });
  assert.match(result, /Dự án cập nhật/); assert.match(result, /Tin tức cập nhật/);
  assert.doesNotMatch(result, /home-reasons-choose/);
});

await check('các khối tĩnh không có hook/sự kiện và vẫn hiển thị đủ khi chưa có bản chụp', () => {
  assert.doesNotMatch(file('src/components/HomeStaticSectionBodies.tsx'), /\bonClick=|\bonError=|\buseState\b|\buseEffect\b/);
  const result = html(currentHome, base);
  assertMarkup(result, normalizeHome(html(baselineHome, base)));
  const slots = staticBodies.createHomeStaticSectionContent(sections, projects, news);
  for (const entry of Object.values(slots)) { assert.equal(typeof entry.signature, 'string'); assert.ok(React.isValidElement(entry.content)); }
});


function refreshFixture(fails = false) {
  const states = [];
  const requests = [];
  const errors = [];
  let cursor = 0;
  let effect;
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect(callback) { effect = callback; },
  };
  const Home = load(file('src/components/Home.tsx'), name => name === 'react' ? hooks : homeDependencies(currentBodies)(name), {
    async fetch(url, options) {
      requests.push({ url, options });
      return { ok: !fails, status: fails ? 503 : 200, async json() { return {
        products: [{ ...products[0], title: 'Sản phẩm làm mới' }],
        projects: [{ ...projects[0], title: 'Dự án làm mới qua API' }],
        news: [{ ...news[0], title: 'Tin tức làm mới qua API' }],
      }; } };
    },
    console: { error: (...args) => errors.push(args) },
  }).default;
  const props = { ...base, refreshOnMount: true, serverStaticSections: staticBodies.createHomeStaticSectionContent(sections, projects, news) };
  return {
    requests, errors,
    render() { cursor = 0; return renderToStaticMarkup(Home(props)); },
    async refresh() { effect(); for (let i = 0; i < 3; i++) await new Promise(setImmediate); },
  };
}

await check('nhánh làm mới API cập nhật dữ liệu khi máy chủ yêu cầu tải lại', async () => {
  const fixture = refreshFixture();
  fixture.render(); await fixture.refresh();
  const result = fixture.render();
  assert.equal(fixture.requests.length, 1);
  assert.equal(fixture.requests[0].url, '/api/home-data');
  assert.equal(fixture.requests[0].options.cache, 'no-store');
  assert.match(result, /Sản phẩm làm mới/);
  assert.match(result, /Dự án làm mới qua API/);
  assert.match(result, /Tin tức làm mới qua API/);
  assert.equal(fixture.errors.length, 0);
});

await check('API làm mới lỗi vẫn giữ nội dung ban đầu và xử lý lỗi', async () => {
  const fixture = refreshFixture(true);
  const initial = fixture.render(); await fixture.refresh();
  assertMarkup(fixture.render(), initial);
  assert.equal(fixture.errors.length, 1);
});

console.log('Kiểm thử khối trang chủ dựng máy chủ: ' + passed + '/8 đạt.');
