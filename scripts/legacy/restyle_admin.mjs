import fs from 'fs';

const filePath = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix dark mode hardcoded table headers & rows
// thead
content = content.replace(/bg-black\/80 text-slate-700/g, 'bg-slate-200 text-slate-700');
// tbody dividers
content = content.replace(/divide-zinc-800/g, 'divide-slate-200');
// tr hover
content = content.replace(/hover:bg-zinc-800\/30/g, 'hover:bg-slate-100');
// white text on light bg fixes
content = content.replace(/text-zinc-100/g, 'text-slate-800');
content = content.replace(/text-zinc-200/g, 'text-slate-700');
content = content.replace(/text-zinc-300/g, 'text-slate-600');
content = content.replace(/text-zinc-400/g, 'text-slate-500');

// 2. Replace yellow brand colors with primary brand colors
// When background is yellow, text was black. Now bg is primary (dark green), text should be white.
content = content.replace(/bg-yellow-500 text-black/g, 'bg-primary text-white');
content = content.replace(/bg-yellow-500 text-zinc-900/g, 'bg-primary text-white');
// General yellow replacements
content = content.replace(/yellow-500/g, 'primary');
content = content.replace(/yellow-400/g, 'primary-light');
content = content.replace(/yellow-600/g, 'primary-dark');

// 3. Fix the top bar GitHub sync banner if any
// It used to be bg-amber-950/15 border border-yellow-500/20 text-amber-250
content = content.replace(/bg-amber-950\/15/g, 'bg-primary/5');
content = content.replace(/text-amber-250/g, 'text-primary-dark');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Restyled admin panel.');
