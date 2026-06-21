import * as fs from 'fs';

const filePath = 'src/components/AdminPanel.tsx';
let source = fs.readFileSync(filePath, 'utf-8');

// The user specified "Điều chỉnh các tiêu đề: k viết hoa tất cả", meaning no uppercase titles.
// Removing 'uppercase' class from the whole file as it is mostly used in headings and labels.
source = source.replace(/\s+\buppercase\b\s+/g, ' ');
source = source.replace(/"\s+\buppercase\b/g, '"');
source = source.replace(/\buppercase\b\s+"/g, '"');
source = source.replace(/\buppercase\b/g, ''); // catch any leftovers

fs.writeFileSync(filePath, source);
console.log('Removed uppercase class.');
