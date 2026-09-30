import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync('src/components/HomeHeroBanner.tsx', 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, {
  exports,
  require(name) {
    if (name === 'next/link') return { __esModule: true, default: ({ prefetch, ...props }) => {
      void prefetch;
      return React.createElement('a', props);
    } };
    return require(name);
  },
});

// Dựng component thật ở máy chủ; không giả lập getImageProps hoặc thay cấu hình ảnh.
const tree = exports.default();
const children = React.Children.toArray(tree.props.children);
const preload = children.find(child => child.type === 'link');
const layout = children.find(child => child.type === 'div');
const figure = React.Children.toArray(layout.props.children).find(child => child.type === 'figure');
const image = React.Children.toArray(figure.props.children).find(child => child.type === 'img');

assert.equal(preload.props.media, '(min-width: 1024px)', 'Di động không tải trước ảnh dưới vùng xem');
assert.equal(preload.props.fetchPriority ?? preload.props.fetchpriority, 'high', 'Desktop phải tải sớm ảnh cạnh tiêu đề');
assert.equal(preload.props.imageSrcSet, image.props.srcSet, 'Tải trước phải dùng đúng các biến thể của ảnh');
assert.equal(preload.props.imageSizes, image.props.sizes, 'Kích thước preload và ảnh phải khớp để tránh tải hai lần');
assert.equal(preload.props.href, image.props.src);
assert.equal(image.props.loading, 'lazy');
assert.equal(image.props.width, 1443);
assert.equal(image.props.height, 770);
assert.ok(image.props.alt.length > 20);
assert.ok(image.props.srcSet.includes('q=65'));

const html = renderToStaticMarkup(tree);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.ok(html.includes('Tìm bất động sản phù hợp, an tâm trong từng quyết định'));
assert.ok(html.includes('href="/san-pham"'));
assert.ok(html.includes('href="#home-hero-consultation"'));
console.log('Đạt: banner dựng đủ nội dung ở máy chủ, preload chỉ cho desktop và dùng đúng biến thể ảnh.');
