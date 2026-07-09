import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/window\.location\.hash/g, 'window.location.pathname');
code = code.replace(/const hash = (\w+)\.location\.pathname/g, 'const path = $1.location.pathname');
code = code.replace(/handleHashChange/g, 'handlePopState');

code = code.replace(/if \(!path \|\| path === '\/' \|\| path === ''\)/g, 'if (!path || path === \'/\' || path === \'#home\' || path === \'\')');
code = code.replace(/else if \(path === '#/g, 'else if (path === \'/');
code = code.replace(/else if \(path\.startsWith\('#/g, 'else if (path.startsWith(\'/');
code = code.replace(/path\.replace\('#/g, 'path.replace(\'/');

code = code.replace(/let targetHash/g, 'let targetPath');
code = code.replace(/targetHash = \`#/g, 'targetPath = `/');
code = code.replace(/targetHash = '#/g, 'targetPath = \'/');
code = code.replace(/targetHash = '\//g, 'targetPath = \'/');
code = code.replace(/targetHash/g, 'targetPath');

fs.writeFileSync('src/App.tsx', code);
