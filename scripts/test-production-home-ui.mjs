import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const origin = 'https://greeniahomes.vn';
const output = resolve('.audit-reports/home-ui');
mkdirSync(output, { recursive: true });
const results = [];
let browser;
let failure = null;

async function verifyRelease() {
  assert.equal(process.env.GITHUB_REPOSITORY, 'mrliga1/web1');
  assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
  assert.ok(process.env.GITHUB_TOKEN);
  const release = JSON.parse(readFileSync('.audit-reports/release.json', 'utf8'));
  assert.equal(release.sha, process.env.GITHUB_SHA, 'Chưa xác nhận phát hành đúng commit');
  assert.equal(release.url, origin + '/');
  const response = await fetch('https://api.github.com/repos/mrliga1/web1/commits/main', {
    headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + process.env.GITHUB_TOKEN },
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(response.ok, 'Không xác nhận được main: HTTP ' + response.status);
  assert.equal((await response.json()).sha, process.env.GITHUB_SHA, 'main đã thay đổi trong lúc kiểm tra');
}

try {
  await verifyRelease();
  assert.ok(process.env.UI_PACKAGE_ROOT, 'Thiếu công cụ kiểm tra đã cài đúng phiên bản');
  const requireRuntime = createRequire(resolve(process.env.UI_PACKAGE_ROOT, '__ui.cjs'));
  assert.equal(requireRuntime('playwright/package.json').version, '1.62.1');
  const { chromium } = requireRuntime('playwright');
  const browserEnv = { ...process.env };
  delete browserEnv.GITHUB_TOKEN;
  browser = await chromium.launch({
    executablePath: process.env.UI_CHROME_PATH || '/usr/bin/google-chrome',
    headless: true, timeout: 30000, env: browserEnv,
  });

  // Chạy tuần tự sau Lighthouse để kiểm tra tương tác không ảnh hưởng phép đo hiệu suất.
  for (const [mode, width, height] of [['desktop', 1440, 1000], ['mobile', 412, 823]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    let page;
    try {
      page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(20000);
      await page.goto(origin + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert.equal(page.url(), origin + '/');
      await page.getByRole('heading', { level: 1, name: 'Tìm bất động sản phù hợp, an tâm trong từng quyết định' }).waitFor();
      assert.equal(await page.locator('h1').count(), 1);
      await page.getByRole('alertdialog', { name: 'Thông báo cookie' }).getByRole('button', { name: 'Đóng', exact: true }).click();
      assert.equal(await page.evaluate(() => localStorage.getItem('cookie_consent')), 'declined');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-greenia-cookie-choice')), 'declined');
      await page.getByRole('alertdialog', { name: 'Thông báo cookie' }).waitFor({ state: 'hidden' });
      const hero = page.locator('#home-hero-banner img').first();
      await hero.scrollIntoViewIfNeeded();
      await hero.evaluate(image => image.decode());
      assert.ok(await hero.evaluate(image => image.naturalWidth > 0));
      if (mode === 'mobile') {
        await page.evaluate(() => window.scrollTo(0, 0));
        const menu = page.getByRole('button', { name: 'Menu di động', exact: true });
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await page.getByRole('navigation', { name: 'Điều hướng di động' }).waitFor({ state: 'visible' });
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      }
      const form = page.locator('#home-hero-banner form');
      await form.getByRole('textbox', { name: 'Họ tên', exact: true }).fill('Khách kiểm thử');
      await form.getByRole('textbox', { name: 'Số điện thoại', exact: true }).fill('0901234567');
      assert.equal(await form.getByRole('textbox', { name: 'Số điện thoại', exact: true }).inputValue(), '0901234567');
      const consent = form.getByRole('checkbox');
      assert.equal(await consent.count(), 2);
      await consent.nth(0).check();
      await consent.nth(1).check();
      assert.equal(await consent.nth(0).isChecked(), true);
      assert.equal(await consent.nth(1).isChecked(), true);
      // Nhập để kiểm tra trạng thái; giữ dữ liệu CRM và email thật bằng cách không gửi form.
      await page.getByRole('button', { name: 'Thêm vào yêu thích', exact: true }).first().click();
      assert.equal(new URL(page.url()).pathname, '/');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('saved_favorites') || '[]').length), 1);
      await page.getByRole('button', { name: 'Bỏ yêu thích', exact: true }).first().click();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('saved_favorites') || '[]').length), 0);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForFunction(() => {
        const header = document.querySelector('header');
        return header && header.getBoundingClientRect().top >= -1;
      });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: resolve(output, mode + '.png') });
      await page.getByRole('link', { name: 'Xem bất động sản', exact: true }).click();
      await page.waitForURL(origin + '/san-pham');
      assert.deepEqual(errors, [], 'Có lỗi JavaScript trong phiên kiểm tra');
      const result = { mode, passed: true, checks: ['H1', 'ghi nhớ từ chối cookie sau tải lại', 'ảnh tải đủ', 'nhập biểu mẫu', 'checkbox', 'thêm/xóa yêu thích', 'CTA', 'thanh điều hướng sau cuộn', 'không tràn ngang', 'không lỗi JavaScript'], mobileMenu: mode === 'mobile' };
      results.push(result);
      console.log(JSON.stringify(result));
    } catch (error) {
      if (page) await page.screenshot({ path: resolve(output, mode + '-failure.png') }).catch(() => undefined);
      throw error;
    } finally {
      await context.close();
    }
  }
  await verifyRelease();
} catch (error) {
  failure = error.message;
  console.error(failure);
  process.exitCode = 1;
} finally {
  writeFileSync(resolve(output, 'results.json'), JSON.stringify({ sha: process.env.GITHUB_SHA, url: origin + '/', time: new Date().toISOString(), results, failure }, null, 2) + '\n');
  if (browser) await browser.close();
}
