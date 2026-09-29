import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Dùng trình duyệt kiểm thử riêng, tránh lỗi dọn thư mục tạm của Chrome Launcher trên Windows.
const runtime = createRequire(resolve(process.env.CODEX_NODE_MODULES || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', '__audit.cjs'));
const { chromium } = runtime('playwright');
const lighthouseRequire = process.env.LIGHTHOUSE_PACKAGE_ROOT
  ? createRequire(resolve(process.env.LIGHTHOUSE_PACKAGE_ROOT, '__audit.cjs'))
  : createRequire(import.meta.url);
const { default: lighthouse } = await import(pathToFileURL(lighthouseRequire.resolve('lighthouse')).href);
const { default: desktopConfig } = await import(pathToFileURL(lighthouseRequire.resolve('lighthouse/core/config/desktop-config.js')).href);
const origin = process.env.AUDIT_PREVIEW_LINK_FILE
  ? readFileSync(resolve(process.env.AUDIT_PREVIEW_LINK_FILE), 'utf8').trim()
  : process.env.UI_TEST_ORIGIN || 'http://127.0.0.1:3001';
const auditUrl = new URL(origin);
const allowedRemoteHosts = new Set(['web1-git-codex-performance-release-greenia-homes.vercel.app', 'greeniahomes.vn']);
assert.ok((auditUrl.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(auditUrl.hostname) && auditUrl.port)
  || (auditUrl.protocol === 'https:' && allowedRemoteHosts.has(auditUrl.hostname)), 'Địa chỉ đo nằm ngoài phạm vi website được cho phép');
assert.ok(!auditUrl.username && !auditUrl.password);

const output = resolve(process.env.AUDIT_OUTPUT_DIR || 'docs/implementation-2026-09-28');
mkdirSync(output, { recursive: true });
const runs = Number(process.env.AUDIT_RUNS || 3);
assert.ok(Number.isInteger(runs) && runs >= 1 && runs <= 3);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, timeout: 60000, args: ['--remote-debugging-port=9223'] });
const summaries = [];
try {
  const modes = process.env.AUDIT_MODE ? [process.env.AUDIT_MODE] : ['mobile', 'desktop'];
  assert.ok(modes.every(mode => ['mobile', 'desktop'].includes(mode)));
  for (const mode of modes) for (let run = 1; run <= runs; run++) {
    console.log('Đang đo Lighthouse:', mode, run);
    const result = await lighthouse(origin, {
      port: 9223, logLevel: 'error', output: ['json', 'html'], maxWaitForLoad: 45000, maxWaitForFcp: 30000,
    }, mode === 'desktop' ? desktopConfig : undefined);
    if (!result || result.lhr.runtimeError) throw new Error(result?.lhr.runtimeError?.message || 'Không tạo được báo cáo Lighthouse');
    const { lhr, report } = result;
    const finalUrl = new URL(lhr.finalDisplayedUrl || lhr.finalUrl);
    assert.equal(finalUrl.hostname, auditUrl.hostname, 'Báo cáo chuyển sang website khác, không được dùng làm điểm của Greenia');
    assert.equal(finalUrl.pathname, auditUrl.pathname, 'Báo cáo chuyển sang trang khác');
    const prefix = `lighthouse-${mode}-final-${run}`;
    if (process.env.AUDIT_TRACE === '1' && result.artifacts?.Trace) {
      writeFileSync(resolve(output, prefix + '.trace.json'), JSON.stringify(result.artifacts.Trace));
    }
    writeFileSync(resolve(output, prefix + '.json'), report[0]);
    writeFileSync(resolve(output, prefix + '.html'), report[1]);
    const summary = {
      mode, run, url: finalUrl.origin + finalUrl.pathname, version: lhr.lighthouseVersion, time: lhr.fetchTime, warnings: lhr.runWarnings.map(warning => warning.replaceAll(origin, auditUrl.origin + auditUrl.pathname).replace(/_vercel_share=[^\s)&#"]+/g, '_vercel_share=[đã ẩn]')), benchmarkIndex: lhr.environment.benchmarkIndex,
      scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, category]) => [key, category.score])),
      metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map((key) => [key, lhr.audits[key].displayValue])),
      failed: Object.values(lhr.categories).flatMap((category) => category.auditRefs.filter((ref) => ref.weight > 0 && lhr.audits[ref.id]?.score !== null && lhr.audits[ref.id]?.score < 1).map((ref) => ({ category: category.id, id: ref.id, score: lhr.audits[ref.id].score }))),
    };
    summaries.push(summary);
    writeFileSync(resolve(output, 'lighthouse-summary.json'), JSON.stringify(summaries, null, 2));
    console.log(JSON.stringify(summary));
  }
} finally {
  let closeTimer;
  try { await Promise.race([browser.close(), new Promise((_, reject) => { closeTimer = setTimeout(() => reject(new Error('Quá thời gian đóng trình duyệt đo hiệu suất')), 30000); })]); }
  finally { clearTimeout(closeTimer); }
}
