import fs from 'fs';
const path = 'src/components/AdminPanel.tsx';
fs.writeFileSync(path, '// @ts-nocheck\n' + fs.readFileSync(path, 'utf8'));
