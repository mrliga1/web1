import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Chỉ đọc HTML công khai; không gửi form, không truy cập hồ sơ khách hoặc khu vực quản trị.
const origin = (process.env.SEARCH_AUDIT_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const production = 'https://greeniahomes.vn';
const output = resolve('docs/implementation-2026-09-28');
const queued = new Set(['/']);
const checked = new Set();
const results = [];
const failures = [];
const decode = (value) => value.replace(/&amp;/g, '&').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10)));
function addLink(value, from) {
  try {
    const url = new URL(decode(value), production + from);
    if (![production, origin].includes(url.origin)) return;
    if (/^\/(?:admin|api|auth|uploads|_next)(?:\/|$)/.test(url.pathname)) return;
    if (/\.(?:webp|png|jpe?g|svg|ico|pdf|xml|txt|json|mp4|woff2?)$/i.test(url.pathname)) return;
    const path = url.pathname + url.search;
    if (!checked.has(path)) queued.add(path);
  } catch { failures.push({ from, link: value, error: 'URL không hợp lệ' }); }
}
try {
  const sitemap = await fetch(origin + '/sitemap.xml', { signal: AbortSignal.timeout(20000) });
  if (!sitemap.ok) throw new Error(`Sitemap HTTP ${sitemap.status}`);
  for (const match of (await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)) addLink(match[1], '/');
  while (queued.size) {
    if (checked.size >= 200) throw new Error('Vượt 200 URL; cần xem lại bộ lọc trước khi mở rộng crawl.');
    const paths = [...queued].slice(0, 3);
    paths.forEach((path) => { queued.delete(path); checked.add(path); });
    await Promise.all(paths.map(async (path) => {
      try {
        const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Greenia-Internal-Link-Audit/1.0' } });
        const html = await response.text();
        const errors = [];
        if (!response.ok) errors.push(`HTTP ${response.status}`);
        if (!/<h1\b/i.test(html)) errors.push('Thiếu H1 trong HTML');
        results.push({ path, status: response.status, errors });
        if (response.ok) for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) addLink(match[1], path);
      } catch (error) { results.push({ path, status: 0, errors: [error.message] }); }
    }));
  }
  failures.push(...results.filter((item) => item.errors.length));
  mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, 'internal-links.json'), JSON.stringify({ origin, checked: results.length, failures, results }, null, 2));
  console.log(JSON.stringify({ checked: results.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
} catch (error) { console.error('Crawl liên kết thất bại:', error.message); process.exitCode = 1; }
