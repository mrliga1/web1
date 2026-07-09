import * as fs from 'fs';

const filePath = 'src/components/AdminPanel.tsx';
let source = fs.readFileSync(filePath, 'utf-8');

// I want to replace common input class patterns with the new ones.
// Current: 'py-2.5 px-3 text-xs', 'py-1.5 px-3 text-xs', 'py-2 px-3 text-xs' 
// Let's replace those specifically in inputs inside the forms
// Replace all sizes for form fields
source = source.replace(/py-2\.5 px-3 text-xs/g, 'h-[30px] py-[10px] px-3 border-box text-[10px]');
source = source.replace(/py-1\.5 px-3 text-xs/g, 'h-[30px] py-[10px] px-3 border-box text-[10px]');
source = source.replace(/py-2 px-3 text-xs/g, 'h-[30px] py-[10px] px-3 border-box text-[10px]');
source = source.replace(/py-\[5px\] px-3 text-\[10px\]/g, 'h-[30px] py-[10px] px-3 border-box text-[10px]');

fs.writeFileSync('src/components/AdminPanel.tsx.tmp', source);
console.log('done');
