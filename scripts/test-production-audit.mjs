import assert from 'node:assert/strict';
import { passesReleaseGate, summarizeReport, withPreparedChrome, officialUrl } from './audit-production-ci.mjs';

let passed = 0;
async function check(name, callback) { await callback(); passed++; console.log('Đạt: ' + name); }
const categories = ['performance', 'accessibility', 'best-practices', 'seo', 'agentic-browsing'];
function report(mode) {
  const audits = Object.fromEntries(['agent-1', 'agent-2', 'agent-3'].map(id => [id, { score: 1 }]));
  for (const id of ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index']) audits[id] = { numericValue: 0, displayValue: '0' };
  return {
    lighthouseVersion: '13.5.0', finalUrl: officialUrl,
    configSettings: { formFactor: mode, throttlingMethod: 'simulate', disableStorageReset: false },
    categories: Object.fromEntries(categories.map(id => [id, { score: 1, auditRefs: id === 'agentic-browsing' ? ['agent-1', 'agent-2', 'agent-3'].map(id => ({ id, weight: 1 })) : [] }])),
    audits, environment: { benchmarkIndex: 3000 }, runWarnings: [],
  };
}
const summaries = () => ['mobile', 'desktop'].flatMap(mode => [1, 2, 3].map(run => summarizeReport(report(mode), mode, run)));

await check('chuẩn bị trang trống, giữ môi trường đo, không đưa quyền GitHub vào Chrome', async () => {
  const order = [];
  const chrome = { port: 32123, async kill() { order.push('kill'); } };
  const result = await withPreparedChrome(async options => {
    assert.equal(options.startingUrl, 'about:blank');
    assert.equal(options.userDataDir, undefined);
    assert.deepEqual(options.chromeFlags, ['--headless', '--no-sandbox']);
    assert.deepEqual(options.envVars, { CHROME_PATH: '/usr/bin/google-chrome' });
    order.push('launch'); return chrome;
  }, async instance => { assert.equal(instance, chrome); order.push('measure'); return 6; }, {
    env: { GITHUB_TOKEN: 'fixture-only', CHROME_PATH: '/usr/bin/google-chrome' },
    async wait(delay) { assert.equal(delay, 10000); order.push('wait'); },
  });
  assert.equal(result, 6); assert.deepEqual(order, ['launch', 'wait', 'measure', 'kill']);
});

await check('đóng đúng Chrome đã tạo nếu phép đo hoặc bước chờ thất bại', async () => {
  for (const failure of ['measure', 'wait']) {
    let killed = 0;
    await assert.rejects(withPreparedChrome(async () => ({ port: 32123, kill() { killed++; } }),
      async () => { throw new Error('measure'); }, { env: {}, wait() { if (failure === 'wait') throw new Error('wait'); } }), new RegExp(failure));
    assert.equal(killed, 1);
  }
});

await check('cổng sai bị chặn trước phép đo và vẫn dọn tiến trình', async () => {
  let killed = 0; let measured = false;
  await assert.rejects(withPreparedChrome(async () => ({ port: 0, kill() { killed++; } }), () => { measured = true; }, { env: {}, wait() {} }), /Cổng Chrome/);
  assert.equal(killed, 1); assert.equal(measured, false);
});

await check('báo cáo giữ xóa cache và cấu hình chuẩn, chặn tên miền hoặc phiên bản sai', () => {
  for (const [change, error] of [
    [r => { r.configSettings.disableStorageReset = true; }, /bộ nhớ đệm/],
    [r => { r.configSettings.throttlingMethod = 'provided'; }, /mô phỏng/],
    [r => { r.finalUrl = 'https://preview.example/'; }, /chính thức/],
    [r => { r.lighthouseVersion = '12.0.0'; }, /Phiên bản/],
  ]) {
    const r = report('mobile'); change(r);
    assert.throws(() => summarizeReport(r, 'mobile', 1), error);
  }
});

await check('chỉ đạt khi đủ sáu lượt và tất cả năm nhóm điểm đều là 100', () => {
  assert.equal(passesReleaseGate(summaries()), true);
  for (const change of [
    rows => rows.pop(),
    rows => { rows[0].scores.performance = 99; },
    rows => { rows[3].scores.seo = 99; },
    rows => { rows[1].warnings.push('Cảnh báo'); },
    rows => { rows[2].agentic.passed = 2; },
    rows => { rows[2].run = rows[0].run; },
  ]) {
    const rows = summaries(); change(rows); assert.equal(passesReleaseGate(rows), false);
  }
});

console.log('Kiểm thử phép đo chính thức: ' + passed + '/5 đạt.');
