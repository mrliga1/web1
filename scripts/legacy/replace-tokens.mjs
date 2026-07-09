import fs from 'fs';
import path from 'path';

const replacements = [
  // Dark backgrounds
  { regex: /\b(bg-slate-900|bg-zinc-900|bg-black|bg-slate-950)\b/g, replace: 'bg-bg-inverse' },
  { regex: /\b(bg-slate-800|bg-zinc-800)\b/g, replace: 'bg-bg-inverse-alt' },
  
  // Light backgrounds
  { regex: /\b(bg-white|bg-slate-50|bg-gray-50)\b/g, replace: 'bg-bg-surface' },

  // Texts on dark bg (light text)
  { regex: /\b(text-slate-300|text-slate-350|text-slate-400|text-slate-450|text-slate-455|text-slate-500|text-zinc-300|text-zinc-400|text-zinc-450|text-gray-300|text-gray-400|text-gray-500)\b/g, replace: 'text-text-inverse/70' },

  // Texts on light bg (dark text)
  { regex: /\b(text-slate-600|text-slate-700|text-slate-800|text-slate-850|text-gray-600|text-gray-700|text-zinc-600|text-zinc-700)\b/g, replace: 'text-text-secondary' },

  // Brand/Accent
  { regex: /\b(text-yellow-400|text-yellow-500|text-amber-400|text-amber-450|text-amber-500)\b/g, replace: 'text-accent' },
  { regex: /\b(bg-yellow-500|bg-amber-450|bg-amber-500)\b/g, replace: 'bg-accent' },
  
  { regex: /\b(text-emerald-500|text-emerald-600|text-emerald-700|text-emerald-800|text-emerald-900)\b/g, replace: 'text-primary' },
  { regex: /\b(bg-emerald-400|bg-emerald-500|bg-emerald-600|bg-emerald-700|bg-emerald-800|bg-emerald-900)\b/g, replace: 'bg-primary' },
  
  // Info
  { regex: /\b(text-blue-400|text-blue-500|text-sky-500)\b/g, replace: 'text-info' },
  
  // Error
  { regex: /\b(text-rose-455|text-rose-500|text-rose-600|text-red-500)\b/g, replace: 'text-error' },
  { regex: /\b(bg-rose-455|bg-rose-500|bg-red-500)\b/g, replace: 'bg-error' },

  // Borders
  { regex: /\b(border-white\/10|border-white\/20)\b/g, replace: 'border-border-inverse' },
  { regex: /\b(border-slate-200|border-slate-300|border-zinc-200|border-zinc-300|border-gray-200|border-gray-300)\b/g, replace: 'border-border-color' },
  { regex: /\b(border-slate-700|border-slate-800|border-zinc-700|border-zinc-800)\b/g, replace: 'border-border-inverse' }
];

const getFiles = (dir, extArray) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(getFiles(file, extArray));
      }
    } else {
      if (extArray.some(ext => file.endsWith(ext))) {
        results.push(file);
      }
    }
  });
  return results;
};

let files = [];
if (fs.existsSync('src')) files = files.concat(getFiles('src', ['.tsx', '.ts']));
if (fs.existsSync('app')) files = files.concat(getFiles('app', ['.tsx', '.ts']));

// Normalize paths and ignore admin files
files = files.filter(f => {
  const norm = f.replace(/\\/g, '/');
  return !norm.includes('src/components/AdminPanel.tsx') && !norm.includes('src/components/VisualDragCanvas.tsx');
});

let totalReplaced = 0;
const fileStats = {};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fileReplacedCount = 0;

  replacements.forEach(({ regex, replace }) => {
    let matches = content.match(regex);
    if (matches) {
      fileReplacedCount += matches.length;
      content = content.replace(regex, replace);
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    fileStats[file] = fileReplacedCount;
    totalReplaced += fileReplacedCount;
  }
});

// Specially process AdminPanel and VisualDragCanvas just for invalid scales
const adminFiles = ['src/components/AdminPanel.tsx', 'src/components/VisualDragCanvas.tsx'];
const invalidScaleReplacements = [
  { regex: /\b(text-slate-350|text-slate-450|text-slate-455|text-zinc-450)\b/g, replace: 'text-slate-400' },
  { regex: /\b(text-slate-850)\b/g, replace: 'text-slate-800' },
  { regex: /\b(text-amber-450)\b/g, replace: 'text-amber-500' },
  { regex: /\b(bg-amber-450)\b/g, replace: 'bg-amber-500' },
  { regex: /\b(text-rose-455)\b/g, replace: 'text-rose-500' },
  { regex: /\b(bg-rose-455)\b/g, replace: 'bg-rose-500' }
];

adminFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let fileReplacedCount = 0;

    invalidScaleReplacements.forEach(({ regex, replace }) => {
      let matches = content.match(regex);
      if (matches) {
        fileReplacedCount += matches.length;
        content = content.replace(regex, replace);
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      fileStats[file] = fileReplacedCount;
      totalReplaced += fileReplacedCount;
    }
  }
});

console.log(`Total replaced: ${totalReplaced}`);
console.log(JSON.stringify(fileStats, null, 2));
