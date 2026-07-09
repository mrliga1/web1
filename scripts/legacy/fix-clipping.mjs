import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

// Replace all the broken/snug height combinations with a safe, proportional one
source = source.replace(/h-\[30px\] py-\[10px\]/g, 'min-h-[32px] py-1.5');
source = source.replace(/h-\[30px\] py-0 h-\[30px\]/g, 'min-h-[32px] py-1.5');
source = source.replace(/h-\[30px\]/g, 'min-h-[32px]');

fs.writeFileSync(filePath, source);
console.log('Fixed clipping on all inputs and selects');
