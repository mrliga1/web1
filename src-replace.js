const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

source = source.replace(/py-2\.5 px-3 text-xs/g, 'px-3 h-[30px] text-[10px]');
source = source.replace(/py-1\.5 px-3 text-xs/g, 'px-3 h-[30px] text-[10px]');
source = source.replace(/py-2 px-3 text-xs/g, 'px-3 h-[30px] text-[10px]');
source = source.replace(/py-\[5px\] px-3 text-\[10px\]/g, 'px-3 h-[30px] text-[10px]');

fs.writeFileSync(filePath, source);
console.log('Replaced input classes');
