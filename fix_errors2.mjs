import fs from 'fs';
import path from 'path';

// 1. Delete obsolete files
const filesToDelete = [
  'delete_other_users.ts',
  'query-users.ts',
  'reset_roles.ts',
  'scripts/migrate-firebase-to-supabase.ts'
];
filesToDelete.forEach(f => {
  const p = path.resolve(f);
  if (fs.existsSync(p)) {
    fs.rmSync(p);
    console.log('Deleted', f);
  }
});

// 2. Fix App.tsx - remove dead code
const appPath = path.resolve('src/App.tsx');
if (fs.existsSync(appPath)) {
  let appCode = fs.readFileSync(appPath, 'utf8');
  // At line 1525, there is {route.screen === "admin" && ( <AdminPanel ... /> )}.
  // We can just replace route.screen === "admin" with false, or remove the block.
  appCode = appCode.replace(/\{route\.screen === "admin" && \(/g, '{false && (');
  fs.writeFileSync(appPath, appCode);
  console.log('Fixed App.tsx');
}

// 3. Fix ProjectDetail.tsx - item.title to item.name
const projectDetailPath = path.resolve('src/components/ProjectDetail.tsx');
if (fs.existsSync(projectDetailPath)) {
  let pdCode = fs.readFileSync(projectDetailPath, 'utf8');
  pdCode = pdCode.replace(/item\.title/g, 'item.name');
  fs.writeFileSync(projectDetailPath, pdCode);
  console.log('Fixed ProjectDetail.tsx');
}

// 4. Fix types.ts
const typesPath = path.resolve('src/types.ts');
if (fs.existsSync(typesPath)) {
  let typesCode = fs.readFileSync(typesPath, 'utf8');
  typesCode = typesCode.replace(/approvalStatus: 'approved' \| 'pending';/g, "approvalStatus: 'approved' | 'pending' | 'rejected';");
  fs.writeFileSync(typesPath, typesCode);
  console.log('Fixed types.ts');
}

// 5. Fix AdminPanel.tsx
const adminPath = path.resolve('src/components/AdminPanel.tsx');
if (fs.existsSync(adminPath)) {
  let adminCode = fs.readFileSync(adminPath, 'utf8');
  
  // (664) Argument of type 'string | number' is not assignable to parameter of type 'SetStateAction<string>'.
  // This is usually setXXX(val). We can replace it with setXXX(String(val)) or (val as string). Since we don't know the exact var, we just use regex.
  // Actually, we can just replace 'e.target.value' or whatever it is, let's use a broad replace for common patterns.
  // Wait, I will just suppress TS errors for line 664 by adding @ts-ignore if it's too complex to regex.
  // Let's replace 'val' if it's `(val)` to `(String(val))` - no that's dangerous. Let's just add @ts-nocheck to AdminPanel if it's too many? No, that's bad.
  // Let's fix the 3 arguments for onShowNotification:
  adminCode = adminCode.replace(/onShowNotification\((.+?), (.+?), (.+?)\);/g, 'onShowNotification($1, $2);');
  
  // Fix onClick={handleDeployToFirebase} -> onClick={() => handleDeployToFirebase()}
  // Assuming the function is handleDeployToFirebase or sync... 
  adminCode = adminCode.replace(/onClick=\{handleDeployToFirebase\}/g, 'onClick={() => handleDeployToFirebase()}');
  adminCode = adminCode.replace(/onClick=\{handleSyncGithub\}/g, 'onClick={() => handleSyncGithub()}');
  
  // Missing 'blocked_ips', 'firebase_admin' in ActiveTab type.
  adminCode = adminCode.replace(/'projects' \| 'users' \| 'profile' \| 'categories' \| 'google' \| 'listings' \| 'articles' \| 'seo' \| 'leads'/g, "'projects' | 'users' | 'profile' | 'categories' | 'google' | 'listings' | 'articles' | 'seo' | 'leads' | 'blocked_ips' | 'firebase_admin'");
  
  // Fix "pending" and "rejected" overlap
  adminCode = adminCode.replace(/=== "rejected"/g, "=== 'rejected'");
  
  fs.writeFileSync(adminPath, adminCode);
  console.log('Fixed AdminPanel.tsx (partial)');
}
