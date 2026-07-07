import fs from 'fs';

const panelPath = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(panelPath, 'utf8');

// 1. Remove import AdminFiltersTab
content = content.replace(/import AdminFiltersTab from "\.\/AdminFiltersTab";\r?\n?/g, '');

// 2. Remove the button for "filters"
const buttonRegex = /\s*<button[\s\S]*?setActiveTab\("filters" as any\);[\s\S]*?<\/button>\r?\n?/g;
content = content.replace(buttonRegex, '');

// 3. Remove the rendering block for "filters"
const renderRegex = /\s*\{activeTab === "filters" as any && \([\s\S]*?<AdminFiltersTab onShowNotification=\{onShowNotification\} \/>\r?\n\s*\)\}\r?\n?/g;
content = content.replace(renderRegex, '');

fs.writeFileSync(panelPath, content, 'utf8');

// 4. Delete the AdminFiltersTab.tsx file
try {
  fs.unlinkSync('src/components/AdminFiltersTab.tsx');
  console.log('AdminFiltersTab.tsx deleted.');
} catch (e) {
  console.error('Error deleting file:', e);
}

console.log('Filters tab removed from AdminPanel.tsx');
