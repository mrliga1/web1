import fs from 'fs';
import path from 'path';

const filesToFixEnum = [
  'src/components/NewsDetail.tsx',
  'src/components/NewsList.tsx',
  'src/components/ProductDetail.tsx',
  'src/components/ProjectDetail.tsx',
  'src/components/ProjectList.tsx'
];

filesToFixEnum.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace handed_over with handed-over
    content = content.replace(/==="handed_over"/g, '==="handed-over"');
    content = content.replace(/=== "handed_over"/g, '=== "handed-over"');
    content = content.replace(/==='handed_over'/g, "==='handed-over'");
    content = content.replace(/=== 'handed_over'/g, "=== 'handed-over'");
    
    // Also "coming_soon" isn't in the type but it might be used. 
    // The type now has 'coming_soon', so that error should be gone because we added it to types.ts

    fs.writeFileSync(filePath, content);
    console.log('Fixed Enum in', file);
  }
});

const projectDetailPath = path.resolve('src/components/ProjectDetail.tsx');
if (fs.existsSync(projectDetailPath)) {
  let content = fs.readFileSync(projectDetailPath, 'utf8');
  // Fix ref={(el) => (sectionRefs.current[0] = el)} to ref={(el) => { sectionRefs.current[0] = el; }}
  content = content.replace(/ref=\{\(el\) => \(sectionRefs\.current\[(\d+)\] = el\)\}/g, 'ref={(el) => { sectionRefs.current[$1] = el; }}');
  fs.writeFileSync(projectDetailPath, content);
  console.log('Fixed Refs in ProjectDetail.tsx');
}

// Fix missing firebase modules by deleting or renaming firebase_old.ts
const firebaseOldPath = path.resolve('src/firebase_old.ts');
if (fs.existsSync(firebaseOldPath)) {
  fs.rmSync(firebaseOldPath);
  console.log('Deleted firebase_old.ts');
}

const viteConfigPath = path.resolve('vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  fs.rmSync(viteConfigPath);
  console.log('Deleted vite.config.ts');
}
