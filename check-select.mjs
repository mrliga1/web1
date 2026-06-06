import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

const regex = /<select([\s\S]*?)>/g;
let m;
while ((m = regex.exec(source)) !== null) {
  if (m[0].includes('className')) {
    console.log(m[0].match(/className="([^"]+)"/)?.[1]);
  }
}
