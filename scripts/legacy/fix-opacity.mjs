import fs from 'fs';
import path from 'path';

const replacements = [
  { regex: /\btext-text-inverse\/70\b/g, replace: 'text-white/70' },
  { regex: /\btext-text-inverse\/50\b/g, replace: 'text-white/50' },
  { regex: /\bbg-bg-inverse\/30\b/g, replace: 'bg-[#0B1F16]/30' },
  { regex: /\bbg-bg-inverse\/40\b/g, replace: 'bg-[#0B1F16]/40' },
  { regex: /\bbg-bg-surface\/10\b/g, replace: 'bg-white/10' },
  { regex: /\bbg-bg-surface\/20\b/g, replace: 'bg-white/20' },
  { regex: /\bbg-bg-base\/80\b/g, replace: 'bg-[#F5F5F0]/80' },
  { regex: /\bbg-primary\/10\b/g, replace: 'bg-[#064E3B]/10' },
  { regex: /\bbg-primary\/20\b/g, replace: 'bg-[#064E3B]/20' },
  // Also fix standard ones that might have been mapped to text-text-secondary but need better contrast?
  // Wait, the user specifically mentioned "màu nền và màu chữ trùng nhau".
  // `text-text-secondary` is `#4B5A52`. If it's on a dark background, it's invisible.
  // Wait, did my previous script replace things incorrectly?
  // Previous script:
  // `text-slate-600|700|800` on light bg -> `text-text-secondary`.
  // BUT the regex was `\b(text-slate-600|text-slate-700|text-slate-800)\b`. I didn't check the background! I just assumed 600/700/800 means it's on a light background.
  // Wait, what if they used `text-slate-600` on a DARK background?
  // Actually, wait, let's look at `App.tsx` footer again!
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

let totalReplaced = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(({ regex, replace }) => {
    content = content.replace(regex, replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
  }
});

console.log(`Fixed opacity classes in ${totalReplaced} files.`);
