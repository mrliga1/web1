const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetCode = `  const handleNavigate = (route: any) => {
    if (route.screen) {
      if (route.screen === 'home') window.location.href = '/';
      else if (route.screen === 'category-product') window.location.href = \`/san-pham?category=\${route.categoryName}\`;
      else window.location.href = \`/\${route.screen}\`;
    }
  };`;

const targetCode2 = `  const handleNavigate = (route: any) => {
    // Next.js migration: this should be handled by links instead,
    // but we pass it as a fallback for internal components that haven't been migrated yet.
    if (route.screen) {
      if (route.screen === 'home') window.location.href = '/';
      else if (route.screen === 'category-product') window.location.href = \`/san-pham?category=\${route.categoryName}\`;
      else window.location.href = \`/\${route.screen}\`;
    }
  };`;

const newCode = `  const router = useRouter();

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };`;

walkDir('./app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes(targetCode)) {
      content = content.replace(targetCode, newCode);
      changed = true;
    } else if (content.includes(targetCode2)) {
      content = content.replace(targetCode2, newCode);
      changed = true;
    }

    if (changed) {
      // Add imports if missing
      if (!content.includes("import { useRouter } from 'next/navigation'")) {
        content = content.replace(/(import.*?;)/, "$1\nimport { useRouter } from 'next/navigation';");
      }
      
      // We need to calculate relative path to src/lib/utils
      const relativeToSrc = path.relative(path.dirname(filePath), './src/lib/utils');
      const importPath = relativeToSrc.replace(/\\/g, '/');
      
      if (!content.includes('getRouteUrl')) {
        content = content.replace(/(import.*?;)/, "$1\nimport { getRouteUrl } from '" + importPath + "';");
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
