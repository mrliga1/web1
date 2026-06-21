const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Add import if needed
  let needsImport = false;

  // match onNavigate({ screen: 'project-detail', projectId: x.id })
  content = content.replace(/onNavigate\(\{\s*screen:\s*'project-detail',\s*projectId:\s*([a-zA-Z0-9_.]+?(?:\.id|\.linkedProjectId)?)\s*\}\)/g, (match, idExpr) => {
    needsImport = true;
    let titleExpr = idExpr;
    if (idExpr.endsWith('.id')) {
        titleExpr = idExpr.replace('.id', '.title');
    } else if (idExpr.endsWith('.linkedProjectId')) {
        titleExpr = "card.title || 'du-an'"; 
    } else {
        titleExpr = "''";
    }
    return `onNavigate({ screen: 'project-detail', projectId: ${idExpr}, slug: generateSlug(${titleExpr}) })`;
  });

  // match onNavigate({ screen: 'product-detail', productId: x.id })
  content = content.replace(/onNavigate\(\{\s*screen:\s*'product-detail',\s*productId:\s*([a-zA-Z0-9_.]+?\.id)\s*\}\)/g, (match, idExpr) => {
    needsImport = true;
    let titleExpr = idExpr.replace('.id', '.title');
    return `onNavigate({ screen: 'product-detail', productId: ${idExpr}, slug: generateSlug(${titleExpr}) })`;
  });

  // match onNavigate({ screen: 'news-detail', newsId: x.id })
  content = content.replace(/onNavigate\(\{\s*screen:\s*'news-detail',\s*newsId:\s*([a-zA-Z0-9_.]+?\.id)\s*\}\)/g, (match, idExpr) => {
    needsImport = true;
    let titleExpr = idExpr.replace('.id', '.title');
    return `onNavigate({ screen: 'news-detail', newsId: ${idExpr}, slug: generateSlug(${titleExpr}) })`;
  });

  if (content !== originalContent && needsImport) {
    if (!content.includes('generateSlug')) {
      // Find the last import statement or the top of the file
      const importRegex = /^import .+?;?\n/gm;
      let lastIndex = 0;
      let m;
      while ((m = importRegex.exec(content)) !== null) {
        lastIndex = m.index + m[0].length;
      }
      
      const relativePath = filePath === 'src/App.tsx' ? './lib/utils' : '../lib/utils';
      const importStmt = `import { generateSlug } from '${relativePath}';\n`;
      content = content.slice(0, lastIndex) + importStmt + content.slice(lastIndex);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}
