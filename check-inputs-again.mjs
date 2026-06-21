import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

const matches = source.match(/className="[^"]*bg-slate[^"]*text-(xs|sm|\[[0-9]+px\])[^"]*"/g);
if (matches) {
  matches.forEach(m => {
    if (m.includes('outline-none') || m.includes('focus:')) {
      console.log(m);
    }
  });
}
