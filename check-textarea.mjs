import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

const matches = source.match(/<textarea[^>]*>/g);
if (matches) {
  matches.forEach(m => console.log(m));
}
