import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

// The user wants padding-top: 10px, padding-bottom: 10px, height: 30px, text size 10px for input fields
// Let's replace the common class combinations for inputs:
// Current patterns like `py-2.5 px-3 text-xs` to `py-[10px] px-3 h-[30px] text-[10px]`
source = source.replace(/py-2\.5 px-3 text-xs/g, 'py-[10px] px-3 h-[30px] text-[10px]');
source = source.replace(/py-1\.5 px-3 text-xs/g, 'py-[10px] px-3 h-[30px] text-[10px]');
source = source.replace(/py-2 px-3 text-xs/g, 'py-[10px] px-3 h-[30px] text-[10px]');
source = source.replace(/py-\[5px\] px-3 text-\[10px\]/g, 'py-[10px] px-3 h-[30px] text-[10px]');

fs.writeFileSync(filePath, source);
console.log('Replaced input classes');
