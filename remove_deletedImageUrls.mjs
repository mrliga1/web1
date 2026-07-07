import fs from 'fs';

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Remove setDeletedImageUrls lines
content = content.replace(/setDeletedImageUrls\(prev => \[\.\.\.prev, imgUrl\]\);/g, '');

fs.writeFileSync('src/components/AdminPanel.tsx', content, 'utf8');
console.log('Removed setDeletedImageUrls');
