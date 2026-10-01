import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const client = require('next/dist/compiled/react-server-dom-webpack/client.edge');
// Ánh xạ trong tiến trình kiểm thử giống React Server Components của App Router.
const serverCode = String.raw`const Module=require('node:module'),load=Module._load;
const React=require('next/dist/compiled/react/react.react-server');
Module._load=function(name,...args){if(name==='react'||name==='next/dist/compiled/react')return React;return load.call(this,name,...args);};
const ReactDOM=require('next/dist/compiled/react-dom/react-dom.react-server');
Module._load=function(name,...args){if(name==='react'||name==='next/dist/compiled/react')return React;if(name==='react-dom'||name==='next/dist/compiled/react-dom')return ReactDOM;return load.call(this,name,...args);};
const server=require('next/dist/compiled/react-server-dom-webpack/server.edge');
(async()=>{
 const section={id:'corporate_intro',visible:true,title:'Thông tin Greenia Homes',description:'Nội dung kiểm thử tham chiếu. '.repeat(150)};
 const mode=process.argv[2];
 const content=React.createElement('section',{id:section.id},section.title);
 const entry=mode==='signature'?{signature:JSON.stringify(section),content}:{section:mode==='clone'?{...section}:section,content};
 const model=process.argv[1]==='entry-first'?{serverStaticSections:{corporate_intro:entry},initialSections:[section]}:{initialSections:[section],serverStaticSections:{corporate_intro:entry}};
 const stream=server.renderToReadableStream(model,{});
 process.stdout.write(Buffer.from(await new Response(stream).arrayBuffer()).toString('base64'));
})().catch(error=>{console.error(error.message);process.exitCode=1;});`;

async function roundTrip(order, mode) {
  const env = { ...process.env, NODE_ENV:'production' };
  delete env.GITHUB_TOKEN;
  const encoded = execFileSync(process.execPath, ['--conditions=react-server','--max-old-space-size=256','-e',serverCode,order,mode], {encoding:'utf8',env,maxBuffer:1048576,stdio:['ignore','pipe','pipe']});
  const bytes = Buffer.from(encoded,'base64');
  const stream = new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}});
  const decoded = await client.createFromReadableStream(stream,{serverConsumerManifest:{moduleMap:null,serverModuleMap:null,moduleLoading:null}});
  return {decoded,wireBytes:bytes.length};
}
let passed = 0;
for (const order of ['sections-first','entry-first']) {
  const shared = await roundTrip(order,'shared');
  assert.equal(shared.decoded.serverStaticSections.corporate_intro.section,shared.decoded.initialSections[0]);
  assert.equal(shared.decoded.initialSections[0].description.split('Nội dung').length,151);
  passed++;
  console.log('Đạt: tham chiếu và nội dung được giữ nguyên, thứ tự '+order);

  const previous = await roundTrip(order,'signature');
  assert.equal(previous.decoded.serverStaticSections.corporate_intro.signature,JSON.stringify(previous.decoded.initialSections[0]));
  assert.ok(previous.wireBytes-shared.wireBytes>5000,'Phải giảm dữ liệu chữ bị gửi lặp');
  passed++;
  console.log(JSON.stringify({order,previousBytes:previous.wireBytes,sharedBytes:shared.wireBytes,savedBytes:previous.wireBytes-shared.wireBytes}));

  const clone = await roundTrip(order,'clone');
  assert.notEqual(clone.decoded.serverStaticSections.corporate_intro.section,clone.decoded.initialSections[0]);
  assert.deepEqual(clone.decoded.serverStaticSections.corporate_intro.section,clone.decoded.initialSections[0]);
  passed++;
  console.log('Đạt: bản sao riêng không bị nhầm là cùng bản chụp, thứ tự '+order);
}
console.log('Kiểm thử truyền tham chiếu khối trang chủ: '+passed+'/6 đạt.');
