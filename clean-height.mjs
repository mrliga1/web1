import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

// clean up height conflicts
source = source.replace(/h-\d+([^]*?)h-\[30px\]/g, (match, p1) => {
  return `h-\d+${p1}`.replace(/h-\d+/, match.split(p1)[0]); // wait, simpler:
});
source = source.replace(/h-[0-9]+ .*?h-\[30px\]/g, (match) => {
  return match.replace('h-[30px] ', '');
});

fs.writeFileSync(filePath, source);
console.log('Cleaned height');
