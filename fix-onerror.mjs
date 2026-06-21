import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Regex to match typical onError
  // onError={(e) => { ... }}
  content = content.replace(/onError=\{\(?[eE]?[^=]*=>\s*\{/g, (match) => {
    if (match.includes('onerror = null') || match.includes('onError = null')) return match;
    const varName = match.includes('(e)') || match.includes(' e ') || match.includes('e =>') ? 'e' : 'e';
    return `onError={(e) => { e.currentTarget.onerror = null;`;
  });

  // Short form: onError={(e) => (e.target as HTMLImageElement).src = '...'}
  content = content.replace(/onError=\{\(?[eE]?[^=]*=>\s*\([^\{][^\}]*\)\.src\s*=\s*['"`](.*?)['"`]\s*\}\}/g, (match, url) => {
     return `onError={(e) => { e.currentTarget.onerror = null; (e.target as HTMLImageElement).src = '${url}'; }}`;
  });

  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
      fixFile(fullPath);
    }
  }
}

walk('./src');
