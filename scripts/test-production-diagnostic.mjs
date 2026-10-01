import assert from 'node:assert/strict';
import { prepareProductionDiagnostic } from './prepare-production-diagnostic.mjs';

const sha = 'a'.repeat(40);
const env = { GITHUB_REPOSITORY:'mrliga1/web1', GITHUB_REF:'refs/heads/main', GITHUB_SHA:sha, GITHUB_TOKEN:'fixture-only' };
function fixture({ head=sha, state='success', homeStatus=200, homeUrl='https://greeniahomes.vn/', githubOk=true } = {}) {
  const requests = [];
  const fetchResource = async (url, options) => {
    requests.push({url,options});
    if (url === 'https://greeniahomes.vn/') return { status:homeStatus, url:homeUrl };
    return { ok:githubOk, status:githubOk?200:401, json:async () => url.endsWith('/status') ? { statuses:[{context:'Vercel',state}] } : {sha:head} };
  };
  return { requests, fetchResource };
}
let passed = 0;
async function check(name, run) { await run(); passed++; console.log('Đạt: '+name); }
await check('xác nhận commit, phát hành và tên miền; giữ quyền GitHub riêng', async () => {
  const f=fixture();const result=await prepareProductionDiagnostic(env,f.fetchResource);
  assert.equal(result.sha,sha);assert.equal(result.url,'https://greeniahomes.vn/');assert.equal(result.diagnosticOnly,true);
  assert.ok(!JSON.stringify(result).includes(env.GITHUB_TOKEN));
  assert.deepEqual(f.requests.find(r=>r.url===result.url).options.headers,{'cache-control':'no-cache'});
});
await check('chặn sai kho, nhánh, commit hoặc thiếu quyền trước kết nối', async () => {
  for (const changed of [{GITHUB_REPOSITORY:'other/repo'},{GITHUB_REF:'refs/heads/preview'},{GITHUB_SHA:'wrong'},{GITHUB_TOKEN:''}]) {
    const f=fixture();await assert.rejects(prepareProductionDiagnostic({...env,...changed},f.fetchResource));
    assert.equal(f.requests.length,0);
  }
});
await check('chặn main đổi hoặc API GitHub không xác nhận được', async () => {
  for (const changed of [{head:'b'.repeat(40)},{githubOk:false}]) {
    const f=fixture(changed);await assert.rejects(prepareProductionDiagnostic(env,f.fetchResource));
    assert.equal(f.requests.filter(r=>r.url==='https://greeniahomes.vn/').length,0);
  }
});
await check('chặn Vercel đang chờ hoặc phát hành lỗi', async () => {
  for (const state of ['pending','failure','error',undefined]) {
    const f=fixture({state:state===undefined?'missing':state});await assert.rejects(prepareProductionDiagnostic(env,f.fetchResource),/Vercel/);
    assert.equal(f.requests.filter(r=>r.url==='https://greeniahomes.vn/').length,0);
  }
});
await check('chặn website lỗi HTTP hoặc chuyển hướng sang tên miền khác', async () => {
  for (const changed of [{homeStatus:500},{homeUrl:'https://preview.example/'}]) {
    const f=fixture(changed);await assert.rejects(prepareProductionDiagnostic(env,f.fetchResource));
  }
});
console.log('Kiểm thử xác nhận bản chẩn đoán: '+passed+'/5 đạt.');
