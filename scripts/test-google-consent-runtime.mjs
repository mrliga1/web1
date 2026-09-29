import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
const runtime=createRequire(resolve('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','__google_test.cjs'));
const { chromium }=runtime('playwright');
const compiled=ts.transpileModule(readFileSync('src/lib/tracking.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
// Đọc container Google công khai đã tải trước; mọi yêu cầu mạng lúc thử đều bị chặn.
const container=readFileSync(process.env.GOOGLE_TAG_CONTAINER_FILE || '.local-backups/gtm-container.js','utf8');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,timeout:60000});
try {
  const page=await browser.newPage();
  let blockedRequests=0;
  await page.route('**/*',route=>{blockedRequests++;return route.abort();});
  await page.setContent('<!doctype html><title>Kiểm thử lựa chọn cookie</title><p>Chỉ kiểm thử tại máy</p>');
  await page.evaluate(compiled=>{
    const api={};
    new Function('exports',compiled)(api);
    window.trackingFixture=api;
    api.setTrackingConsent('denied',true);
    api.setManualIpTrackingPolicy('allowed');
    window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
  },compiled);
  await page.addScriptTag({content:container});
  await page.waitForFunction(()=>window.google_tag_data?.ics?.entries?.ad_storage,{timeout:30000});
  const read=()=>page.evaluate(()=>Object.fromEntries(['ad_storage','analytics_storage','ad_user_data','ad_personalization'].map(key=>{const value=window.google_tag_data.ics.entries[key];return [key,{default:value.default,update:value.update}];})));
  const denied=await read();
  assert.equal(denied.ad_storage.default,false);
  assert.equal(denied.analytics_storage.default,false);
  await page.evaluate(()=>window.trackingFixture.setTrackingConsent('granted'));
  await page.waitForFunction(()=>window.google_tag_data.ics.entries.ad_storage.update===true);
  const granted=await read();
  await page.evaluate(()=>window.trackingFixture.setTrackingConsent('denied'));
  await page.waitForFunction(()=>window.google_tag_data.ics.entries.ad_storage.update===false);
  const revoked=await read();
  for(const value of Object.values(revoked))assert.equal(value.update,false);
  const result={passed:true,realGoogleContainer:true,externalRequestsBlocked:true,blockedRequests,denied,granted,revoked};
  writeFileSync('docs/performance-2026-09-29/google-consent-runtime.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} finally {let timer;try {await Promise.race([browser.close(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Quá thời gian đóng kiểm thử Google')),30000);})]);}finally {clearTimeout(timer);}}
