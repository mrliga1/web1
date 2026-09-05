import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import ts from 'typescript';

// Chạy trên bản production cục bộ; chặn gửi form để không tạo dữ liệu khách thật.
const requireRuntime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__test.cjs'));
const { chromium } = requireRuntime('playwright');
const origin = process.env.UI_TEST_ORIGIN || 'http://127.0.0.1:3001';
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const results = [];
let submitted;
await page.route('**/api/consultations', async (route) => {
  submitted = route.request().postDataJSON();
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'local-test-only', success: true, trackingEligible: false }) });
});
await page.route(/https:\/\/[^/]*(google-analytics\.com|facebook\.com|analytics\.google\.com)\//, route => route.fulfill({ status: 204 }));

try {
  await page.goto(origin + '/category-product/nha-pho-biet-thu');
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await page.waitForURL(origin + '/san-pham');
  await page.getByRole('heading', { name: 'Nhà phố - Biệt thự', exact: true }).waitFor({ state: 'hidden' });
  results.push({ test: 'Xóa cả danh mục và URL bộ lọc', passed: true });

  await page.goto(origin);
  const name = page.locator('form input[type="text"]').first();
  const phone = page.locator('form input[type="tel"]').first();
  await name.fill('Kiểm thử');
  await phone.focus();
  for (const delay of [0, 80, 350]) {
    if (delay) await page.waitForTimeout(delay);
    for (const input of [name, phone]) {
      const style = await input.evaluate(el => {
        const css = getComputedStyle(el);
        return { shadow: css.boxShadow, outline: css.outlineStyle, outlineWidth: css.outlineWidth, outlineColor: css.outlineColor };
      });
      assert.equal(style.shadow, 'none');
      assert.ok(style.outline === 'none' || parseFloat(style.outlineWidth) === 0 || style.outlineColor === 'rgba(0, 0, 0, 0)', JSON.stringify(style));
    }
  }
  assert.match(await page.locator('form').first().innerText(), /Tôi đã đọc và đồng ý/);
  results.push({ test: 'Viền đơn khi focus, blur và trong lúc chuyển ô', passed: true });

  // Dùng chính biểu thức class của sidebar thật làm fixture CSS, không giả đăng nhập.
  const adminSource = readFileSync('src/components/AdminPanel.tsx', 'utf8');
  const ast = ts.createSourceFile('AdminPanel.tsx', adminSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let sidebarClassExpression;
  function findSidebar(node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(ast) === 'aside') {
      const props = node.attributes.properties;
      if (props.some(a => ts.isJsxAttribute(a) && a.name.getText(ast) === 'id' && a.initializer?.text === 'wp-admin-sidebar')) {
        sidebarClassExpression = props.find(a => ts.isJsxAttribute(a) && a.name.getText(ast) === 'className').initializer.expression.getText(ast);
      }
    }
    ts.forEachChild(node, findSidebar);
  }
  findSidebar(ast);
  assert.ok(sidebarClassExpression);
  const sidebarClass = new Function('sidebarOpen', 'desktopSidebarOpen', `return ${sidebarClassExpression}`)(true, true);
  await page.evaluate(className => {
    const layout = document.querySelector('.site-nav-spacer').parentElement;
    layout.setAttribute('data-admin-layout', 'true');
    const fixture = document.createElement('div');
    fixture.id = 'wp-admin-root';
    const aside = document.createElement('aside');
    aside.id = 'wp-admin-sidebar';
    aside.className = className;
    aside.innerHTML = '<div style="height:72px;flex-shrink:0">Sidebar kiểm thử CSS</div><div style="overflow:auto;flex:1">Menu quản trị</div>';
    fixture.appendChild(aside);
    document.querySelector('main').prepend(fixture);
  }, sidebarClass);
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#mobile-toggle').click();
    await page.waitForTimeout(400);
    const rects = await page.evaluate(() => ({
      headerBottom: document.querySelector('#main-nav').getBoundingClientRect().bottom,
      sidebarTop: document.querySelector('#wp-admin-sidebar').getBoundingClientRect().top,
      spacer: document.querySelector('.site-nav-spacer').getBoundingClientRect().height,
    }));
    assert.ok(rects.sidebarTop >= rects.headerBottom - 1, JSON.stringify(rects));
    assert.ok(rects.spacer >= rects.headerBottom - 1, JSON.stringify(rects));
    const screenshot = resolve(tmpdir(), `greenia-sidebar-${viewport.width}.png`);
    await page.screenshot({ path: screenshot });
    await page.locator('#mobile-toggle').click();
    await page.waitForTimeout(350);
    const closedTop = await page.locator('#wp-admin-sidebar').evaluate(el => el.getBoundingClientRect().top);
    assert.ok(closedTop >= 39 && closedTop <= 42);
    results.push({ test: 'Sidebar và khung admin dưới menu', viewport, passed: true, rects, screenshot });
  }

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(origin + '/du-an/vinhomes-can-gio');
  const expectedTitle = await page.locator('main h1').first().innerText();
  await page.getByRole('button', { name: 'Đăng ký tư vấn', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tư vấn mua nhà chuyên sâu' });
  await dialog.locator('input[type="text"]').fill('Khách kiểm thử cục bộ');
  await dialog.locator('input[type="tel"]').fill('0901234567');
  await dialog.locator('input[type="email"]').fill('test@example.com');
  await dialog.locator('textarea').fill('Quan tâm phương án thanh toán');
  await dialog.locator('#quote-popup-terms').check();
  await dialog.locator('#quote-popup-privacy').check();
  const submissionResponse = page.waitForResponse(response => response.url() === origin + '/api/consultations' && response.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Nhận tư vấn ngay', exact: true }).click();
  assert.equal((await submissionResponse).status(), 200);
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(submitted.sourceUrl, origin + '/du-an/vinhomes-can-gio');
  assert.equal(submitted.popupOpenedUrl, submitted.sourceUrl);
  assert.equal(submitted.pageTitle, expectedTitle.trim());
  assert.equal(submitted.demand, 'Quan tâm phương án thanh toán');
  results.push({ test: 'Popup giữ đúng nguồn trang và nhu cầu; không gửi CRM thật', passed: true });

  for (const type of ['product', 'project', 'news']) {
    await page.goto(origin);
    const link = page.locator(`a[data-content-link="${type}"]`).first();
    const href = await link.getAttribute('href');
    await link.scrollIntoViewIfNeeded();
    await link.evaluate((el, targetHref) => el.addEventListener('click', () => {
      window.__testClickAt = performance.now();
      requestAnimationFrame(() => {
        const loadingVisible = Array.from(document.querySelectorAll('[role="status"]')).some(status => /Đang (mở|tải) nội dung/.test(status.textContent));
        window.__testNavigationFeedback = {
          elapsedMs: Math.round(performance.now() - window.__testClickAt),
          visible: loadingVisible || location.pathname === new URL(targetHref, location.href).pathname,
        };
      });
    }, { once: true }), href);
    await link.click();
    await page.waitForFunction(() => window.__testNavigationFeedback !== undefined);
    const feedback = await page.evaluate(() => window.__testNavigationFeedback);
    assert.equal(feedback.visible, true, 'Phải có phản hồi chuyển trang ngay ở khung hình kế tiếp');
    await page.waitForURL(origin + href);
    await page.locator('main h1').first().waitFor();
    assert.notEqual(await page.locator('main h1').first().innerText(), '404');
    const elapsed = await page.evaluate(() => Math.round(performance.now() - window.__testClickAt));
    assert.ok(Number.isFinite(elapsed), 'Liên kết phải chuyển nội dung trong ứng dụng, không tải lại toàn trang');
    results.push({ test: 'Mở trang ' + type, passed: true, elapsedMs: elapsed, feedbackMs: feedback.elapsedMs });
  }
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  console.error(JSON.stringify(results, null, 2));
  const screenshot = resolve(tmpdir(), 'greenia-ui-regression-failure.png');
  await page.screenshot({ path: screenshot }).catch(() => {});
  console.error('Ảnh kiểm tra khi lỗi:', screenshot);
  throw error;
} finally {
  await context.close();
  await browser.close();
}
