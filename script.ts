import fs from 'fs';

let content = fs.readFileSync('src/components/ProjectDetail.tsx', 'utf-8');

const replacements = [
  { from: 'className="text-sm text-slate-200 font-medium text-right"', to: 'className="text-[13px] md:text-sm text-slate-200 font-medium text-right"' },
  { from: 'className="text-xs text-slate-400 shrink-0 mt-0.5"', to: 'className="text-[13px] md:text-sm text-slate-400 shrink-0 mt-0.5"' },
  { from: 'className="text-xs text-slate-400 shrink-0 mt-0.5 border-t border-slate-700/50 block w-full pt-[5px] mb-[15px]"', to: 'className="text-[13px] md:text-sm text-slate-400 shrink-0 mt-0.5 border-t border-slate-700/50 block w-full pt-[5px] mb-[15px]"' },
  { from: 'className="text-sm text-amber-500 font-bold text-right border-t border-slate-700/50 block w-full pt-[5px] mb-[15px]"', to: 'className="text-[13px] md:text-sm text-amber-500 font-bold text-right border-t border-slate-700/50 block w-full pt-[5px] mb-[15px]"' },
  { from: 'className="w-full py-[5px] rounded-lg border border-slate-700 hover:border-amber-500 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"', to: 'className="w-full py-[5px] rounded-lg border border-slate-700 hover:border-amber-500 hover:bg-slate-800 text-white text-[13px] md:text-sm font-semibold transition-colors"' },
  { from: 'className="text-sm text-slate-400 max-w-lg mx-auto"', to: 'className="text-[13px] md:text-sm text-slate-400 max-w-lg mx-auto"' },
  { from: 'className="text-amber-500 hover:text-amber-400 text-sm font-medium whitespace-nowrap"', to: 'className="text-amber-500 hover:text-amber-400 text-[13px] md:text-sm font-medium whitespace-nowrap"' },
  { from: 'text-sm transition-colors', to: 'text-[13px] md:text-sm transition-colors' },
  { from: 'text-[13px] md:text-[13px] md:text-sm transition-colors', to: 'text-[13px] md:text-sm transition-colors' }, // Fix any double replacements
  { from: 'text-sm md:text-base', to: 'text-[13px] md:text-base' },
  { from: 'text-sm md:text-[15px]', to: 'text-[13px] md:text-[15px]' },
  { from: 'text-sm text-slate-300 line-clamp-3 mb-4 flex-1', to: 'text-[13px] font-light md:text-sm text-slate-300 line-clamp-3 mb-4 flex-1' },
  { from: 'text-amber-500 text-sm font-bold', to: 'text-amber-500 text-[13px] md:text-sm font-bold' },
  { from: 'text-slate-400 text-sm', to: 'text-slate-400 text-[13px] md:text-sm' },
  { from: 'text-sm py-[5px]', to: 'text-[13px] md:text-sm py-[5px]' },
  { from: 'text-sm transition-all', to: 'text-[13px] md:text-sm transition-all' }
];

for (const {from, to} of replacements) {
  content = content.split(from).join(to);
}

fs.writeFileSync('src/components/ProjectDetail.tsx', content);

// Also ProductDetail.tsx
let prodContent = fs.readFileSync('src/components/ProductDetail.tsx', 'utf-8');
const prodReplacements = [
  ...replacements,
  { from: 'text-sm text-slate-300 !pb-0', to: 'text-[13px] md:text-sm text-slate-300 !pb-0' },
  { from: 'text-sm text-slate-400 flex items-center', to: 'text-[13px] md:text-sm text-slate-400 flex items-center' },
  { from: 'text-sm text-white', to: 'text-[13px] md:text-sm text-white' },
];

for (const {from, to} of prodReplacements) {
  prodContent = prodContent.split(from).join(to);
}
fs.writeFileSync('src/components/ProductDetail.tsx', prodContent);
