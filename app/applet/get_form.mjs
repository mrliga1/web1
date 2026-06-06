import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

const s = source.split('onSubmit={handleCreateContent}');
console.log(s[1].substring(0, 3000));
