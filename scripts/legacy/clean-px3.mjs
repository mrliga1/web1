import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

source = source.replace(/px-3 px-3/g, 'px-3');
fs.writeFileSync(filePath, source);
console.log('cleaned px-3 px-3');
