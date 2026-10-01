import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function prepareProductionDiagnostic(env = process.env, fetchResource = fetch) {
  assert.equal(env.GITHUB_REPOSITORY, 'mrliga1/web1', 'Kho mã ngoài phạm vi');
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Chỉ chẩn đoán bản main');
  assert.match(env.GITHUB_SHA || '', /^[a-f0-9]{40}$/, 'Commit không hợp lệ');
  assert.ok(env.GITHUB_TOKEN, 'Thiếu quyền xác nhận GitHub');
  const apiOrigin = 'https://api.github.com/repos/mrliga1/web1';
  const headers = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + env.GITHUB_TOKEN };
  async function github(path) {
    const response = await fetchResource(apiOrigin + path, { headers, signal: AbortSignal.timeout(15000) });
    assert.ok(response.ok, 'Không xác nhận được GitHub: HTTP ' + response.status);
    return response.json();
  }
  const [head, status] = await Promise.all([github('/commits/main'), github('/commits/' + env.GITHUB_SHA + '/status')]);
  assert.equal(head.sha, env.GITHUB_SHA, 'main đã thay đổi');
  const vercel = status.statuses.find(item => item.context.toLowerCase() === 'vercel');
  assert.equal(vercel?.state, 'success', 'Vercel chưa phát hành đúng commit');
  const url = 'https://greeniahomes.vn/';
  // Không chuyển quyền GitHub sang yêu cầu tới website công khai.
  const home = await fetchResource(url, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15000) });
  assert.equal(home.status, 200, 'Trang chính thức không trả HTTP 200');
  assert.equal(home.url, url, 'Tên miền chính thức bị chuyển hướng');
  return { sha: env.GITHUB_SHA, repository: env.GITHUB_REPOSITORY, url, time: new Date().toISOString(), diagnosticOnly: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const evidence = await prepareProductionDiagnostic();
    mkdirSync('.audit-reports', { recursive: true });
    writeFileSync('.audit-reports/release.json', JSON.stringify(evidence, null, 2) + '\n');
    console.log(JSON.stringify(evidence));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
