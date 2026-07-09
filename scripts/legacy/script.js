const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}
const files = walk('src');
console.log('Found files:', files.length);
files.forEach(f => {
  let cnt = fs.readFileSync(f, 'utf8');
  let newCnt = cnt.replace(/<img\s+/g, '<img loading="lazy" decoding="async" ');
  
  // Custom deduplication code
  let maxLoop = 10;
  while(maxLoop > 0) {
    let before = newCnt;
    newCnt = newCnt.replace(/loading="lazy"\s*loading="lazy"/gi, 'loading="lazy"');
    newCnt = newCnt.replace(/decoding="async"\s*decoding="async"/gi, 'decoding="async"');
    if (before === newCnt) break;
    maxLoop--;
  }

  if (cnt !== newCnt) {
    console.log('updating ' + f);
    fs.writeFileSync(f, newCnt, 'utf8');
  }
});
