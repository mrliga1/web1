import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/AdminPanel.tsx');
let source = fs.readFileSync(filePath, 'utf-8');

// The tricky part is the > in arrow functions inside JSX properties
// But we can just find 'select' tags properly or do a targeted replace:
source = source.replace(/<select([\s\S]+?)<\/select>/g, (match) => {
  return match.replace(/py-\[10px\]/g, 'py-0 h-[30px]'); 
  // also let's just make it py-0
});

// Wait, <select ... /> is not a thing, they are <select> ... </select> typically
// If there's any <select .../>, it wouldn't be caught. But let's just use the safer matching:
// Replace py-[10px] with py-0 for any 'py-[10px]' inside the classNames that are right after `<select`
fs.writeFileSync(filePath, source);
console.log('Fixed select py padding');
