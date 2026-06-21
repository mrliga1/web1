import fs from 'fs';
import path from 'path';

const walk = (dir: string): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  });
  return results;
};

const componentsDir = './src/components';
const files = walk(componentsDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  const regex = /<img(?![^>]*loading=["']lazy["'])/g;
  newContent = newContent.replace(regex, '<img loading="lazy" decoding="async"');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
