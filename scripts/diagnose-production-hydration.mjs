import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { instrumentReactHydrationCapture } from './hydration-diagnostics.mjs';

const origin = 'https://greeniahomes.vn';
const output = resolve('.audit-reports/hydration');
const runs = [];
let browser;
let failure = null;
const diagnosticMode = process.env.HYDRATION_DIAGNOSTIC_MODE === '1';
let preparedRuntime = null;
mkdirSync(output, { recursive: true });

async function verifyRelease() {
  assert.equal(process.env.GITHUB_REPOSITORY, 'mrliga1/web1');
  assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
  assert.ok(process.env.GITHUB_TOKEN);
  const release = JSON.parse(readFileSync('.audit-reports/release.json', 'utf8'));
  assert.equal(release.sha, process.env.GITHUB_SHA);
  assert.equal(release.url, origin + '/');
  const response = await fetch('https://api.github.com/repos/mrliga1/web1/commits/main', {
    headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + process.env.GITHUB_TOKEN },
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(response.ok, 'Không xác nhận được main: HTTP ' + response.status);
  assert.equal((await response.json()).sha, process.env.GITHUB_SHA);
}

function installHydrationObserver() {
  const snapshots = [];
  window.__greeniaHydrationSnapshots = snapshots;
  window.__greeniaHydrationCapture = fiber => {
    if (snapshots.length >= 10) return;
    const describeChildren = children => {
      if (typeof children === 'string' || typeof children === 'number') return String(children).slice(0, 200);
      const list = Array.isArray(children) ? children : [children];
      return list.slice(0, 20).map(child => {
        if (typeof child === 'string' || typeof child === 'number') return String(child).slice(0, 80);
        if (!child || typeof child !== 'object') return typeof child;
        return { type: typeof child.type === 'string' ? child.type : child.type?.displayName || child.type?.name || typeof child.type, key: child.key, id: child.props?.id };
      });
    };
    const chain = [];
    for (let node = fiber; node && chain.length < 20; node = node.return) {
      const props = node.pendingProps || node.memoizedProps || {};
      const element = node.stateNode?.nodeType === 1 ? node.stateNode : null;
      chain.push({
        tag: node.tag, type: typeof node.type === 'string' ? node.type : node.type?.displayName || node.type?.name || typeof node.type,
        key: node.key,
        props: { id: props.id, className: props.className, href: props.href, role: props.role, children: describeChildren(props.children) },
        dom: element ? {
          tag: element.tagName, id: element.id, className: element.getAttribute('class'),
          html: element.outerHTML.slice(0, 2000),
          children: Array.from(element.childNodes).slice(0, 32).map(child => ({ tag: child.nodeName, id: child.nodeType === 1 ? child.id : undefined, text: child.textContent?.slice(0, 100) })),
        } : null,
      });
    }
    snapshots.push({ time: performance.now(), chain });
  };
}


async function loadVerifiedDiagnosticRuntime() {
  const home=await fetch(origin+'/',{signal:AbortSignal.timeout(15000)});
  assert.equal(home.status,200);assert.equal(home.url,origin+'/');
  const match=(await home.text()).match(/src="([^"]*\/_next\/static\/chunks\/4bd1b696-[^"]+\.js(?:\?[^"]*)?)"/);
  assert.ok(match,'Không tìm thấy mã React tại bản chính thức');
  const url=new URL(match[1],origin);assert.equal(url.origin,origin);
  const response=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error'});
  assert.equal(response.status,200);assert.equal(response.url,url.href);
  return {url:url.href,observation:instrumentReactHydrationCapture(await response.text())};
}

try {
  await verifyRelease();
  if(diagnosticMode) preparedRuntime=await loadVerifiedDiagnosticRuntime();
  assert.ok(process.env.UI_PACKAGE_ROOT);
  const requireRuntime = createRequire(resolve(process.env.UI_PACKAGE_ROOT, '__hydration.cjs'));
  assert.equal(requireRuntime('playwright/package.json').version, '1.62.1');
  const { chromium } = requireRuntime('playwright');
  const browserEnv = { ...process.env };
  delete browserEnv.GITHUB_TOKEN;
  browser = await chromium.launch({ executablePath: process.env.UI_CHROME_PATH || '/usr/bin/google-chrome', headless: true, timeout: 30000, env: browserEnv });

  const originalDesktop = Array.from({ length:3 }, (_,index) => ({ mode:'desktop',index:index+1,instrumented:false,width:1350,height:940 }));
  const originalMobile = Array.from({ length:3 }, (_,index) => ({ mode:'mobile',index:index+1,instrumented:false,width:412,height:823 }));
  const observedMobile = Array.from({ length:12 }, (_,index) => ({ mode:'mobile',index:index+1,instrumented:true,width:412,height:823,rate:index<6?1:4 }));
  const observedDesktop = Array.from({ length:12 }, (_,index) => ({ mode:'desktop',index:index+1,instrumented:true,width:1350,height:940 }));
  const plan = diagnosticMode
    ? [...originalDesktop,...observedMobile,...originalMobile,...observedDesktop]
    : [...originalDesktop,...originalMobile,...observedMobile,...observedDesktop];
  // Các lượt quan sát chạy sau Lighthouse trên phiên trống, chỉ dùng tìm lỗi.
  for (const sample of plan) {
    const context = await browser.newContext({ viewport: { width: sample.width, height: sample.height } });
    let page;
    const errors = [];
    const routeScripts = [];
    const runtime = [];
    const routeErrors = [];
    try {
      page = await context.newPage();
      page.setDefaultTimeout(20000);
      if(sample.rate&&sample.rate!==1){
        const cdp=await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate',{rate:sample.rate});
      }
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        const url = new URL(response.url());
        if (url.origin === origin && /\/_next\/static\/chunks\/app\/(?:du-an|tin-tuc|lien-he|san-pham)\/page-/.test(url.pathname)) routeScripts.push(url.pathname);
      });
      if (sample.instrumented) {
        await page.addInitScript(installHydrationObserver);
        await page.route(/^https:\/\/greeniahomes\.vn\/_next\/static\/chunks\/4bd1b696-[^/]+\.js(?:\?.*)?$/, async route => {
          try {

            if(preparedRuntime) assert.equal(route.request().url(),preparedRuntime.url);
            const response=preparedRuntime?null:await route.fetch({timeout:30000,maxRedirects:0});
            if(response) assert.equal(response.status(),200);
            const observation=preparedRuntime?.observation||instrumentReactHydrationCapture(await response.text());
            runtime.push({url:response?response.url():preparedRuntime.url,originalSha256:observation.originalSha256,instrumentedSha256:observation.instrumentedSha256,servedFromVerifiedMemory:Boolean(preparedRuntime)});
            const headers=response?response.headers():{'content-type':'application/javascript'};
            delete headers['content-length'];delete headers['content-encoding'];
            await route.fulfill({...response?{response}:{status:200},body:observation.code,headers});
          } catch (error) {
            routeErrors.push(error.message);
            await route.abort('failed');
          }
        });
      }
      const response = await page.goto(origin + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert.equal(response.status(), 200);
      assert.equal(page.url(), origin + '/');
      await page.getByRole('heading', { level: 1, name: 'Tìm bất động sản phù hợp, an tâm trong từng quyết định' }).waitFor();
      // Chờ tác vụ gắn tương tác ban đầu, không thao tác hay gửi biểu mẫu.

      if(sample.instrumented){
        for(let attempt=0;runtime.length===0&&routeErrors.length===0&&attempt<60;attempt++) await page.waitForTimeout(500);
        assert.equal(runtime.length,1,'Chưa quan sát đúng runtime React');
      }
      await page.waitForTimeout(1500);
      const snapshots = sample.instrumented ? await page.evaluate(() => window.__greeniaHydrationSnapshots || []) : [];
      if (errors.length || snapshots.length) await page.screenshot({ path: resolve(output, sample.mode + '-' + sample.index + '-' + (sample.instrumented ? 'observed' : 'original') + '.png') });
      const result = { ...sample, errors, routeScripts: [...new Set(routeScripts)], runtime, routeErrors, snapshots };
      if (sample.instrumented) assert.equal(runtime.length, 1, 'Chưa quan sát đúng runtime React');
      runs.push(result);
      console.log(JSON.stringify({ mode: sample.mode, index: sample.index, instrumented: sample.instrumented, errors: errors.length, captures: snapshots.length, routeScripts: result.routeScripts.length }));
    } finally {
      await context.close();
    }
  }
  await verifyRelease();
  const originalRuns = runs.filter(run => !run.instrumented);
  assert.equal(originalRuns.length, 6);
  assert.ok(originalRuns.every(run => run.errors.length === 0), 'Có lỗi JavaScript với runtime nguyên gốc');
  assert.ok(originalRuns.every(run => run.routeScripts.length === 0), 'Menu vẫn tự tải mã trang khác');
  assert.ok(runs.every(run => run.routeErrors.length === 0), 'Chẩn đoán runtime chưa chạy đúng');
} catch (error) {
  failure = error.message;
  console.error(failure);
  process.exitCode = 1;
} finally {
  writeFileSync(resolve(output, 'results.json'), JSON.stringify({
    sha: process.env.GITHUB_SHA, url: origin + '/', time: new Date().toISOString(),
    diagnosticOnlyForInstrumentedRuns: true, performanceGateUnchanged: true, servedVerifiedRuntimeFromMemory: diagnosticMode, runs, failure,
  }, null, 2) + '\n');
  if (browser) await browser.close();
}
