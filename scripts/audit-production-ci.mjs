import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const officialUrl = 'https://greeniahomes.vn/';
export const auditPreparationUrl = 'data:text/html,' + encodeURIComponent('<!doctype html><html><head><title>Chuẩn bị phép đo</title></head><body></body></html>');
const categories = ['performance', 'accessibility', 'best-practices', 'seo', 'agentic-browsing'];
const metricIds = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];

export function summarizeReport(report, mode, run) {
  assert.ok(!report.runtimeError, report.runtimeError?.message || 'Lỗi thu thập Lighthouse');
  assert.equal(report.lighthouseVersion, '13.5.0', 'Phiên bản Lighthouse không đúng');
  assert.equal(new URL(report.finalDisplayedUrl || report.finalUrl).href, officialUrl, 'Báo cáo phải đo trang chủ chính thức');
  assert.equal(report.configSettings.formFactor, mode, 'Cấu hình thiết bị không đúng');
  assert.equal(report.configSettings.throttlingMethod, 'simulate', 'Phải giữ cách mô phỏng chuẩn của Lighthouse');
  assert.equal(report.configSettings.disableStorageReset, false, 'Mỗi lượt phải xóa dữ liệu và bộ nhớ đệm trình duyệt');
  const scores = Object.fromEntries(categories.map(id => {
    const score = report.categories[id]?.score;
    assert.ok(typeof score === 'number' && score >= 0 && score <= 1, 'Thiếu điểm hợp lệ: ' + id);
    return [id, Math.round(score * 100)];
  }));
  const agenticRefs = report.categories['agentic-browsing'].auditRefs.filter(ref => ref.weight > 0 && report.audits[ref.id]?.score !== null);
  return {
    mode, run, url: officialUrl, time: report.fetchTime, version: report.lighthouseVersion,
    benchmarkIndex: report.environment.benchmarkIndex, warnings: report.runWarnings || [], scores,
    agentic: { passed: agenticRefs.filter(ref => report.audits[ref.id]?.score === 1).length, total: agenticRefs.length },
    metrics: Object.fromEntries(metricIds.map(id => [id, { value: report.audits[id].numericValue, display: report.audits[id].displayValue }])),
    failed: categories.flatMap(id => report.categories[id].auditRefs
      .filter(ref => ref.weight > 0 && report.audits[ref.id]?.score !== null && report.audits[ref.id]?.score < 1)
      .map(ref => ({ category: id, id: ref.id, score: report.audits[ref.id].score }))),
  };
}

export function passesReleaseGate(reports) {
  return reports.length === 6 && ['mobile', 'desktop'].every(mode => {
    const runs = reports.filter(report => report.mode === mode);
    return runs.length === 3 && new Set(runs.map(report => report.run)).size === 3
      && runs.every(report => categories.every(id => report.scores[id] === 100)
        && report.warnings.length === 0 && report.agentic.total === 3 && report.agentic.passed === 3);
  });
}

export async function withPreparedChrome(launch, measure, {
  env = process.env,
  wait = milliseconds => new Promise(done => setTimeout(done, milliseconds)),
} = {}) {
  const browserEnv = { ...env };
  delete browserEnv.GITHUB_TOKEN;
  // Điều hướng tài liệu trống trong bộ nhớ để Chrome hoàn tất khởi tạo giao diện nội bộ.
  const chrome = await launch({
    startingUrl: auditPreparationUrl,
    chromeFlags: ['--headless', '--no-sandbox'],
    envVars: browserEnv,
  });
  try {
    assert.ok(Number.isInteger(chrome.port) && chrome.port > 0 && chrome.port <= 65535, 'Cổng Chrome không hợp lệ');
    await wait(10000);
    return await measure(chrome);
  } finally {
    await chrome.kill();
  }
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA;
  assert.equal(repository, 'mrliga1/web1', 'Kho mã nằm ngoài phạm vi được phép');
  assert.match(sha || '', /^[a-f0-9]{40}$/);
  assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Chỉ kiểm tra bản chính thức từ main');
  assert.ok(process.env.GITHUB_TOKEN, 'Thiếu quyền kết nối GitHub của lượt kiểm tra');
  const cli = process.env.LIGHTHOUSE_CLI;
  assert.ok(cli && existsSync(cli), 'Chưa cài công cụ Lighthouse');
  const output = resolve('.audit-reports');
  mkdirSync(output, { recursive: true });
  const targetUrl = 'https://github.com/' + repository + '/actions/runs/' + process.env.GITHUB_RUN_ID;
  const results = [];
  let measured = false;

  async function github(path, body) {
    const response = await fetch('https://api.github.com/repos/' + repository + path, {
      method: body ? 'POST' : 'GET',
      headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + process.env.GITHUB_TOKEN, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('GitHub trả lỗi ' + response.status + ' tại ' + path);
    return response.json();
  }

  async function verifyCurrentMain() {
    const commit = await github('/commits/main');
    assert.equal(commit.sha, sha, 'main đã đổi; không dùng phép đo này cho bản mới');
  }

  async function publishStatus(mode, state, description) {
    await github('/statuses/' + sha, { state, context: 'Greenia Lighthouse/' + mode, description, target_url: targetUrl });
  }

  try {
    await verifyCurrentMain();
    // Chờ bản triển khai của đúng commit; mỗi lần chờ tối đa 20 giây.
    let deployed = false;
    for (let attempt = 0; attempt < 36; attempt++) {
      const status = await github('/commits/' + sha + '/status');
      const vercel = status.statuses.find(item => item.context.toLowerCase() === 'vercel');
      if (vercel?.state === 'success') { deployed = true; break; }
      if (vercel && ['failure', 'error'].includes(vercel.state)) throw new Error('Vercel chưa phát hành thành công commit này');
      await new Promise(resolveWait => setTimeout(resolveWait, 20000));
    }
    assert.ok(deployed, 'Hết thời gian xác nhận bản phát hành Vercel');
    await verifyCurrentMain();
    const home = await fetch(officialUrl, { signal: AbortSignal.timeout(15000), headers: { 'cache-control': 'no-cache' } });
    assert.equal(home.status, 200, 'Trang chính thức không trả HTTP 200');
    assert.equal(home.url, officialUrl, 'Trang chính thức bị chuyển hướng ngoài địa chỉ đo');
    writeFileSync(resolve(output, 'release.json'), JSON.stringify({
      sha, repository, targetUrl, url: officialUrl, time: new Date().toISOString(),
      runner: { os: process.platform, node: process.version }, lighthouseVersion: '13.5.0',
    }, null, 2) + '\n');

    const requireLighthouse = createRequire(resolve(cli));
    const { launch } = await import(pathToFileURL(requireLighthouse.resolve('chrome-launcher')).href);
    await withPreparedChrome(launch, async chrome => {
      writeFileSync(resolve(output, 'browser-preparation.json'), JSON.stringify({
        startingUrl: auditPreparationUrl, settleMilliseconds: 10000, freshProfile: true,
        storageResetPerRun: true, time: new Date().toISOString(),
      }, null, 2) + '\n');
      for (const mode of ['mobile', 'desktop']) {
        await publishStatus(mode, 'pending', 'Đang đo 3 lượt trên tên miền chính thức');
        for (let run = 1; run <= 3; run++) {
          await verifyCurrentMain();
          const prefix = resolve(output, 'lighthouse-' + mode + '-' + run);
          const args = [cli, officialUrl, '--port=' + chrome.port, '--output=json', '--output=html',
            '--output-path=' + prefix, '--save-assets', '--max-wait-for-load=45000', '--max-wait-for-fcp=30000'];
          if (mode === 'desktop') args.push('--preset=desktop');
          // Không chuyển quyền GitHub sang tiến trình duyệt website.
          const childEnv = { ...process.env };
          delete childEnv.GITHUB_TOKEN;
          console.log('Đang đo ' + mode + ', lượt ' + run);
          await new Promise((resolveChild, reject) => {
            const child = spawn(process.execPath, args, { stdio: 'inherit', env: childEnv });
            child.once('error', reject);
            child.once('exit', (code, signal) => code === 0 ? resolveChild() : reject(new Error('Lighthouse kết thúc lỗi: ' + (signal || code))));
          });
          const report = JSON.parse(readFileSync(prefix + '.report.json', 'utf8'));
          const summary = summarizeReport(report, mode, run);
          results.push(summary);
          writeFileSync(resolve(output, 'summary.json'), JSON.stringify({ sha, url: officialUrl, reports: results }, null, 2) + '\n');
          console.log(JSON.stringify(summary));
        }
        const runs = results.filter(report => report.mode === mode);
        const minimum = id => Math.min(...runs.map(report => report.scores[id]));
        const passed = runs.every(report => categories.every(id => report.scores[id] === 100) && report.warnings.length === 0 && report.agentic.passed === 3 && report.agentic.total === 3);
        await publishStatus(mode, passed ? 'success' : 'failure',
          '3 lượt; thấp nhất: P ' + minimum('performance') + ', A ' + minimum('accessibility') + ', BP ' + minimum('best-practices') + ', SEO ' + minimum('seo') + ', Agentic ' + minimum('agentic-browsing'));
      }
    });
    await verifyCurrentMain();
    measured = true;
    if (!passesReleaseGate(results)) process.exitCode = 1;
  } catch (error) {
    process.exitCode = 1;
    console.error(error.message);
    writeFileSync(resolve(output, 'error.json'), JSON.stringify({ sha, error: error.message, time: new Date().toISOString() }, null, 2) + '\n');
    for (const mode of ['mobile', 'desktop']) {
      try { await publishStatus(mode, 'error', 'Phép đo chưa hoàn tất; xem báo cáo của lượt chạy'); }
      catch (statusError) { console.error('Không ghi được trạng thái: ' + statusError.message); }
    }
  } finally {
    const rows = results.map(report => '| ' + report.mode + ' | ' + report.run + ' | ' + categories.map(id => report.scores[id]).join(' | ') + ' | ' + report.agentic.passed + '/' + report.agentic.total + ' |');
    const markdown = [
      '# Kiểm tra bản chính thức', '', 'Commit: ' + sha, '', 'URL: ' + officialUrl, '',
      '| Thiết bị | Lượt | Performance | Accessibility | Best Practices | SEO | Agentic | Số mục Agentic |',
      '|---|---:|---:|---:|---:|---:|---:|---:|', ...rows, '',
      measured && passesReleaseGate(results) ? 'Đạt yêu cầu 100 điểm trong cả 6 lượt.' : 'Chưa đạt điều kiện bàn giao.', '',
    ].join('\n');
    writeFileSync(resolve(output, 'summary.md'), markdown);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
