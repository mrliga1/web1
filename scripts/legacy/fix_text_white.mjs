import fs from 'fs';

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Fix text-black when used with bg-primary
content = content.replace(/bg-primary hover:bg-amber-600 text-black/g, 'bg-primary hover:bg-amber-600 text-white');
content = content.replace(/bg-primary hover:bg-amber-600 active:scale-\[0\.98\] text-black/g, 'bg-primary hover:bg-amber-600 active:scale-[0.98] text-white');
// Any other text-black near bg-primary?
// We see "bg-primary text-white" was replaced properly for some, but others were `text-black`.
// We can just globally replace `bg-primary text-black` just in case.
content = content.replace(/bg-primary text-black/g, 'bg-primary text-white');

// Wait, I saw "text-accent border border-primary/30 hover:bg-primary hover:text-white" which is fine.

fs.writeFileSync('src/components/AdminPanel.tsx', content, 'utf8');
console.log('Fixed text-white');
