import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compileText = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const compile = path => compileText(readFileSync(path, 'utf8'));
function load(code, dependencies, globals = {}) {
  const evaluatedModule = { exports: {} };
  vm.runInNewContext(code, {
    module: evaluatedModule, exports: evaluatedModule.exports,
    require: name => name === 'react/jsx-runtime' ? require(name) : dependencies(name), ...globals,
  });
  return evaluatedModule.exports;
}
const normalized = load(compile('src/lib/editableTextValue.ts'), name => { throw new Error(name); });
const before = compileText(execFileSync('git', ['show', '7515ddc23200759401201aa228e019a1a9a5420c:src/components/EditableComponent.tsx'], { encoding: 'utf8' }));
const imports = [];
const publicHooks = { ...React, useState() { throw new Error('Khách xem không cần state biên tập'); }, useEffect() { throw new Error('Khách xem không cần effect biên tập'); } };
const editorCode = compile('src/components/EditableComponentEditor.tsx');
function deps(hooks, authFetch = () => { throw new Error('Không được tải lên trong kiểm thử này'); }) {
  return name => {
    if (name === 'react') return hooks;
    if (name === 'lucide-react') return { Sparkles: props => React.createElement('svg', props) };
    if (name === '../lib/authFetch') return { authFetch };
    if (name === '../lib/editableTextValue') return normalized;
    throw new Error('Phụ thuộc ngoài phạm vi: ' + name);
  };
}
const baseline = load(before, deps(React));
const publicView = load(compile('src/components/EditableComponent.tsx'), name => {
  if (name === 'next/dynamic') return loader => { imports.push(loader); return function DeferredEditor() { return null; }; };
  if (name === './EditableComponentEditor') return load(editorCode, deps(React));
  return deps(publicHooks)(name);
});
const defaultProps = { sectionId: 'custom', field: 'title', sections: [{ id: 'custom', visible: true, title: 'Tiêu đề' }], onUpdateSections() {}, isEditMode: false };
const markup = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const same = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));
let passed = 0;
async function check(name, callback) { await callback(); passed++; console.log('Đạt: ' + name); }

await check('HTML chữ công khai giữ nguyên nội dung, xuống dòng, thẻ và chữ chuyển màu', () => {
  const values = [undefined, '', 'Nội dung tiếng Việt', 'Dòng 1\nDòng 2', 'Trước [gradient]Nổi bật[/gradient] sau', '<script>alert(1)</script>', '[gradient]Chưa kết thúc', '12,500+ / 12,500 / 0% rủi ro / 0% lo ngại', 'Phong thủy độc bách cát tường', 'Giải pháp độc quyền phong thủy', 'Đội tuyển đại sư tư vấn địa thế hướng phong, bài bài bài trí rước sinh khí dồi dào tài lộc của gia chủ sâu sắc tinh tường.', 'Giao dịch minh bạch qua 4 bước khép kín: Thẩm định giá chính thực, Thẩm định tính pháp lý sổ hồng, Trao đổi phân tích sâu cùng chuyên gia nhãn quan phong thủy, và Hoàn công bàn giao dồi dào tài lộc'];
  for (const value of values) for (const tag of ['p', 'h2', 'span']) {
    const props = { ...defaultProps, value, tag, className: 'text-primary font-bold' };
    assert.equal(markup(publicView.EditableText, props), markup(baseline.EditableText, props));
  }
});

await check('HTML ảnh công khai giữ nguyên ảnh và trạng thái chưa có ảnh', () => {
  for (const imageUrl of ['', '/no-image.svg', 'https://images.example/nhà.jpg?x=1&y=2']) {
    const props = { ...defaultProps, imageUrl, className: 'aspect-video', onShowNotification() {} };
    assert.equal(markup(publicView.EditableImage, props), markup(baseline.EditableImage, props));
  }
});

await check('làm mới nội dung công khai dùng props mới ngay và không khởi tạo công cụ sửa', () => {
  assert.match(markup(publicView.EditableText, { ...defaultProps, value: 'Nội dung mới' }), /Nội dung mới/);
  assert.match(markup(publicView.EditableImage, { ...defaultProps, imageUrl: '/ảnh-mới.jpg' }), /ảnh-mới.jpg/);
  assert.equal(imports.length, 2);
});

await check('bật chỉnh sửa chuyển đầy đủ props đến đúng trình chỉnh sửa', async () => {
  for (const [name, index, expected] of [['EditableText', 0, 'TextEditor'], ['EditableImage', 1, 'ImageEditor']]) {
    const props = { ...defaultProps, isEditMode: true, value: 'Nội dung', imageUrl: '/ảnh.jpg' };
    const element = publicView[name](props);
    assert.equal(element.props.value, props.value);
    assert.equal(element.props.sections, props.sections);
    const Component = await imports[index]();
    assert.equal(typeof Component, 'function');
    assert.equal(Component.name, expected);
  }
});

function editorFixture(props, { uploadFails = false } = {}) {
  const states = [];
  let cursor = 0;
  let effect;
  const updates = [];
  const notifications = [];
  const uploads = [];
  const hooks = { ...React,
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
    useEffect(callback) { effect = callback; },
  };
  const editor = load(editorCode, deps(hooks, async (url, options) => {
    uploads.push({ url, body: JSON.parse(options.body) });
    if (uploadFails) throw new Error('Tải ảnh thất bại');
    return { async json() { return { url: '/uploaded.jpg' }; } };
  }), { FileReader: class {
    readAsDataURL() { this.onload({ target: { result: 'data:image/png;base64,fixture' } }); }
  }, console });
  const inputProps = { ...defaultProps, ...props, isEditMode: true, onUpdateSections: value => updates.push(value), onShowNotification: (...value) => notifications.push(value) };
  function render(name = 'TextEditor') { cursor = 0; return editor[name](inputProps); }
  return { render, updates, notifications, uploads, props: inputProps, sync() { effect?.(); } };
}
function find(tree, type) {
  const results = [];
  const visit = element => { if (!React.isValidElement(element)) return; if (element.type === type) results.push(element); React.Children.forEach(element.props.children, visit); };
  visit(tree); return results;
}

await check('sửa chữ và nội dung nhiều dòng cập nhật đúng trường, giữ các section khác', () => {
  for (const [isArea, subField] of [[false, undefined], [true, 'description']]) {
    const sections = [{ id: 'custom', visible: true, title: 'Cũ', extraData: { description: 'Mô tả', preserve: 'Giữ' } }, { id: 'other', visible: true, title: 'Không sửa' }];
    const f = editorFixture({ value: 'Cũ', isArea, subField, sections });
    f.render().props.onClick({ stopPropagation() {} });
    find(f.render(), isArea ? 'textarea' : 'input')[0].props.onChange({ target: { value: 'Nội dung sửa\nDòng mới' } });
    find(f.render(), isArea ? 'textarea' : 'input')[0].props.onBlur();
    assert.equal(f.updates.length, 1);
    assert.equal(subField ? f.updates[0][0].extraData.description : f.updates[0][0].title, 'Nội dung sửa\nDòng mới');
    assert.equal(f.updates[0][0].extraData.preserve, 'Giữ');
    same(f.updates[0][1], sections[1]);
  }
});

await check('sửa URL ảnh và cập nhật props giữ đúng dữ liệu được lưu', () => {
  const f = editorFixture({ field: 'imageUrl', imageUrl: '/old.jpg' });
  find(f.render('ImageEditor'), 'button')[0].props.onClick({ stopPropagation() {} });
  find(f.render('ImageEditor'), 'input').find(node => node.props.type === 'text').props.onChange({ target: { value: '/new.jpg' } });
  find(f.render('ImageEditor'), 'button').at(-1).props.onClick({ stopPropagation() {} });
  assert.equal(f.updates[0][0].imageUrl, '/new.jpg');
  f.props.imageUrl = '/server-refresh.jpg'; f.render('ImageEditor'); f.sync();
  assert.equal(find(f.render('ImageEditor'), 'img')[0].props.src, '/server-refresh.jpg');
});

await check('tải ảnh và nhánh lỗi mạng vẫn hoạt động như trước', async () => {
  for (const uploadFails of [false, true]) {
    const f = editorFixture({ field: 'imageUrl', imageUrl: '/old.jpg' }, { uploadFails });
    await find(f.render('ImageEditor'), 'input').find(node => node.props.type === 'file').props.onChange({ target: { files: [{ name: 'photo.png' }] } });
    assert.equal(f.uploads[0].url, '/api/upload');
    assert.equal(f.updates[0][0].imageUrl, uploadFails ? 'data:image/png;base64,fixture' : '/uploaded.jpg');
    assert.equal(f.notifications.at(-1)[1], 'success');
  }
});

console.log('Kiểm thử tách biên tập: ' + passed + '/7 đạt.');
