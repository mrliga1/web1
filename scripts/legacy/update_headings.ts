import fs from 'fs';

let content = fs.readFileSync('src/components/ProjectDetail.tsx', 'utf-8');
content = content.replace(/md:text-3xl/g, 'md:text-[26px]');
fs.writeFileSync('src/components/ProjectDetail.tsx', content);
