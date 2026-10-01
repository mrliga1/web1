import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve,relative,sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
const require=createRequire(import.meta.url);
const postcss=require('postcss');
const selectors=require('postcss-selector-parser');
const ts=require('typescript');
const loadConfig=require('tailwindcss/loadConfig');
const glob=require('fast-glob');
const root=resolve('.');
const short=path=>relative(root,path).split(sep).join('/');
const names=process.argv.slice(2,5);
assert.equal(names.length,3,'Cần CSS gốc, CSS công khai và CSS quản trị đã biên dịch.');
const css=names.map(name=>readFileSync(name,'utf8'));

function rules(content){
 const result=new Map();
 postcss.parse(content).walkRules(rule=>{
  const context=[];
  for(let parent=rule.parent;parent&&parent.type!=='root';parent=parent.parent){
   if(parent.type==='atrule')context.unshift(parent.name+':'+parent.params);
  }
  const declarations=rule.nodes.filter(node=>node.type==='decl').map(node=>node.prop+':'+node.value+(node.important?'!important':'')).join(';');
  for(const selector of selectors().astSync(rule.selector).nodes){
   const key=context.join('/')+'|'+selector.toString();
   if(!result.has(key))result.set(key,new Set());
   result.get(key).add(declarations);
  }
 });
 return result;
}
const before=rules(css[0]),pub=rules(css[1]),admin=rules(css[2]);
const missing=[];
let checked=0;
for(const [key,values] of before)for(const value of values){
 checked++;
 if(!pub.get(key)?.has(value)&&!admin.get(key)?.has(value))missing.push({selector:key,declarations:value});
}
assert.deepEqual(missing,[],'Có quy tắc CSS cũ bị thiếu hoặc đổi khai báo.');

const files=execFileSync('rg',['--files','src','app','-g','*.ts','-g','*.tsx','-g','*.js','-g','*.jsx'],{encoding:'utf8'}).trim().split(/\r?\n/).map(path=>resolve(path));
const available=new Set(files);
const configRead=ts.readConfigFile('tsconfig.json',ts.sys.readFile);
assert.ok(!configRead.error);
const options=ts.parseJsonConfigFileContent(configRead.config,ts.sys,root).options;
const cache=ts.createModuleResolutionCache(root,name=>name,options);
const queue=files.filter(path=>short(path).startsWith('app/')&&!/^app\/(admin|api)\//.test(short(path)));
const reached=new Set(),unresolved=[];
while(queue.length){
 const path=queue.shift();
 if(reached.has(path))continue;
 reached.add(path);
 const source=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true);
 const specs=[];
 function visit(node){
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))specs.push(node.moduleSpecifier.text);
  if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||(ts.isIdentifier(node.expression)&&node.expression.text==='require'))){
   if(node.arguments.length===1&&ts.isStringLiteralLike(node.arguments[0]))specs.push(node.arguments[0].text);
   else unresolved.push({file:short(path),expression:node.getText(source)});
  }
  ts.forEachChild(node,visit);
 }
 visit(source);
 for(const spec of specs){
  const result=ts.resolveModuleName(spec,path,options,ts.sys,cache).resolvedModule;
  if(result&&available.has(resolve(result.resolvedFileName)))queue.push(resolve(result.resolvedFileName));
  else if(!result&&(spec.startsWith('.')||spec.startsWith('@/'))&&!/\.(css|svg|png|webp|jpg|jpeg)$/.test(spec))unresolved.push({file:short(path),spec});
 }
}
assert.deepEqual(unresolved,[],'Không xác định được đầy đủ phụ thuộc công khai.');
const publicConfig=loadConfig(resolve('tailwind.public.config.ts'));
const scanned=new Set(glob.sync(publicConfig.content,{absolute:true}).map(path=>resolve(path)));
const absent=[...reached].filter(path=>!scanned.has(path));
assert.deepEqual(absent,[],'CSS công khai đã loại tệp được trang công khai sử dụng.');
assert.match(readFileSync('app/admin/layout.tsx','utf8'),/import ['"]\.\.\/\.\.\/src\/admin\.css['"]/);
assert.match(readFileSync('src/admin.css','utf8'),/@config "\.\.\/tailwind\.config\.ts"/);
assert.match(readFileSync('src/index.css','utf8'),/@config "\.\.\/tailwind\.public\.config\.ts"/);
assert.ok(Buffer.byteLength(css[1])<Buffer.byteLength(css[0]),'Chưa giảm được CSS công khai.');
const report={passed:true,checkedRuleBodies:checked,publicDependencyFiles:reached.size,missingRules:missing.length,missingPublicFiles:absent.length,sizes:css.map((content,index)=>({kind:['before','public','admin'][index],bytes:Buffer.byteLength(content),gzipBytes:gzipSync(content).length}))};
writeFileSync('.local-backups/css-split-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
