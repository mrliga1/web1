import fs from 'fs';
import path from 'path';

const apiDir = 'app/api';

const files = {
  'send-email/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '../lib/firebase-admin';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
    const blockedIpsPath = path.join(process.cwd(), 'blocked-ips.json');
    if (fs.existsSync(blockedIpsPath)) {
      const blocked = JSON.parse(fs.readFileSync(blockedIpsPath, 'utf8'));
      if (blocked.includes(ip)) {
        return NextResponse.json({ error: 'IP is blocked from sending emails' }, { status: 403 });
      }
    }

    const { name, phone, email, message, propertyTitle, sourceUrl } = await req.json();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: getEnv('SMTP_USER') || getEnv('VITE_SMTP_USER'),
        pass: getEnv('SMTP_PASS') || getEnv('VITE_SMTP_PASS')
      }
    });

    const mailOptions = {
      from: \`"Greenia Homes - Web System" <\${getEnv('SMTP_USER') || getEnv('VITE_SMTP_USER')}>\`,
      to: 'thuankdbds@gmail.com',
      subject: \`[Greenia Homes] Yêu Cầu Tư Vấn - \${name} - \${propertyTitle}\`,
      html: \`
        <h2>Yêu Cầu Tư Vấn Bất Động Sản</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="background-color: #f8f9fa; font-weight: bold; width: 35%;">Họ và tên</td><td>\${name}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Số điện thoại</td><td><a href="tel:\${phone}">\${phone}</a></td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Email</td><td>\${email || 'Không cung cấp'}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Mối quan tâm</td><td>\${propertyTitle}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Nguồn yêu cầu</td><td><a href="\${sourceUrl}">\${sourceUrl}</a></td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Lời nhắn</td><td>\${message ? message.replace(/\\n/g, '<br/>') : 'Không có'}</td></tr>
        </table>
        <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">Email được gửi tự động từ hệ thống website Greenia Homes.</p>
      \`
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'firebase-admin-config/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { initFirebaseAdmin } from '../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { base64Json } = await req.json();
    if (!base64Json) return NextResponse.json({ error: 'Missing base64 JSON' }, { status: 400 });

    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    if (envContent.includes('FIREBASE_SERVICE_ACCOUNT_BASE64=')) {
      envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT_BASE64=.*/g, \`FIREBASE_SERVICE_ACCOUNT_BASE64=\${base64Json}\`);
    } else {
      envContent += \`\\nFIREBASE_SERVICE_ACCOUNT_BASE64=\${base64Json}\\n\`;
    }

    fs.writeFileSync(envPath, envContent);
    initFirebaseAdmin();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'firebase-admin-status/route.ts': `import { NextResponse } from 'next/server';
import { admin } from '../lib/firebase-admin';

export async function GET() {
  const isConfigured = admin.apps && admin.apps.length > 0;
  return NextResponse.json({ configured: isConfigured });
}
`,
  'users/[uid]/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { admin } from '../../lib/firebase-admin';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params;
    if (!admin.apps || admin.apps.length === 0) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }
    await admin.auth().deleteUser(uid);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'github-config/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { token, owner, repo, branch } = await req.json();
    if (!token || !owner || !repo) return NextResponse.json({ error: 'Missing token, owner or repo' }, { status: 400 });

    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const setEnv = (key: string, val: string) => {
      if (envContent.includes(\`\${key}=\`)) {
        envContent = envContent.replace(new RegExp(\`\${key}=.*\\n?\`, 'g'), \`\${key}='\${val}'\\n\`);
      } else {
        envContent += \`\\n\${key}='\${val}'\\n\`;
      }
    };

    setEnv('GITHUB_TOKEN', token);
    setEnv('GITHUB_OWNER', owner);
    setEnv('GITHUB_REPO', repo);
    setEnv('GITHUB_BRANCH', branch || 'main');

    fs.writeFileSync(envPath, envContent);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'github-status/route.ts': `import { NextResponse } from 'next/server';
import { getEnv, getDecodedGithubToken } from '../lib/firebase-admin';

export async function GET() {
  const token = getDecodedGithubToken();
  const owner = getEnv('GITHUB_OWNER') || getEnv('VITE_GITHUB_OWNER');
  const repo = getEnv('GITHUB_REPO') || getEnv('VITE_GITHUB_REPO');

  return NextResponse.json({
    configured: !!(token && owner && repo),
    owner: owner || null,
    repo: repo || null
  });
}
`,
  'blocked-ips/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getPath = () => path.join(process.cwd(), 'blocked-ips.json');

export async function GET() {
  const p = getPath();
  if (fs.existsSync(p)) {
    return NextResponse.json(JSON.parse(fs.readFileSync(p, 'utf8')));
  }
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const { ips } = await req.json();
    fs.writeFileSync(getPath(), JSON.stringify(ips, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'fs/files/route.ts': `import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getFiles(filepath, fileList);
      }
    } else {
      fileList.push(filepath);
    }
  }
  return fileList;
}

export async function GET() {
  try {
    const srcDir = path.join(process.cwd(), 'src');
    const files = getFiles(srcDir).map(f => f.replace(srcDir + path.sep, '').replace(/\\\\/g, '/'));
    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'fs/read/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json();
    const targetPath = path.join(process.cwd(), 'src', filePath);
    if (!fs.existsSync(targetPath)) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    const content = fs.readFileSync(targetPath, 'utf8');
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'fs/write/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { filePath, content } = await req.json();
    const targetPath = path.join(process.cwd(), 'src', filePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, 'utf8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'fs/search/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function searchFiles(dir: string, pattern: string, results: any[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchFiles(filepath, pattern, results);
      }
    } else {
      const content = fs.readFileSync(filepath, 'utf8');
      if (content.includes(pattern)) {
        results.push({
          file: filepath.replace(path.join(process.cwd(), 'src') + path.sep, '').replace(/\\\\/g, '/'),
          matches: (content.match(new RegExp(pattern, 'g')) || []).length
        });
      }
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const { pattern } = await req.json();
    const srcDir = path.join(process.cwd(), 'src');
    const results = searchFiles(srcDir, pattern);
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'fs/modify-element/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { filePath, oldContent, newContent } = await req.json();
    const targetPath = path.join(process.cwd(), 'src', filePath);
    if (!fs.existsSync(targetPath)) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    let fileContent = fs.readFileSync(targetPath, 'utf8');
    if (!fileContent.includes(oldContent)) {
      return NextResponse.json({ error: 'Content to replace not found' }, { status: 400 });
    }
    fileContent = fileContent.replace(oldContent, newContent);
    fs.writeFileSync(targetPath, fileContent, 'utf8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,
  'upload/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { getEnv, getDecodedGithubToken } from '../lib/firebase-admin';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { name, base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: 'Missing base64' }, { status: 400 });

    const matches = base64.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
    let base64Data = base64;
    let fileExtension = 'png';
    if (matches && matches.length === 3) {
      base64Data = matches[2];
      fileExtension = matches[1].split('/')[1] || 'png';
    }

    const originalRefName = name ? path.parse(name).name : 'img';
    const sanitisedFilename = originalRefName.replace(/[^a-zA-Z0-9-_]/g, '');
    const finalFilename = \`\${sanitisedFilename}-\${Date.now()}.\${fileExtension}\`;
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    
    const targetFilePath = path.join(uploadsDir, finalFilename);
    const binaryData = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(targetFilePath, binaryData);

    const uploadedRelativeUrl = \`/uploads/\${finalFilename}\`;

    // GitHub sync logic
    let isRemoteSynced = false;
    let fallbackCommitError = '';
    let githubToken = getDecodedGithubToken();
    let githubOwner = getEnv('GITHUB_OWNER') || getEnv('VITE_GITHUB_OWNER');
    let githubRepo = getEnv('GITHUB_REPO') || getEnv('VITE_GITHUB_REPO');
    let githubBranch = getEnv('GITHUB_BRANCH') || getEnv('VITE_GITHUB_BRANCH') || 'main';

    if (githubOwner.startsWith('ghp_') || githubOwner.startsWith('github_pat_')) {
      const cacheVal = githubOwner;
      githubOwner = githubToken;
      githubToken = cacheVal;
    }

    if (githubToken && githubOwner && githubRepo) {
      try {
        const url = \`https://api.github.com/repos/\${githubOwner}/\${githubRepo}/contents/public/uploads/\${finalFilename}\`;
        const authHeaderValue = (githubToken.startsWith('ghp_') || githubToken.startsWith('github_pat_')) ? \`token \${githubToken}\` : \`Bearer \${githubToken}\`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const syncResponse = await fetch(url, {
          method: 'PUT',
          headers: { 'Authorization': authHeaderValue, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Greenia-Homes-Uploader' },
          body: JSON.stringify({ message: \`Upload \${finalFilename}\`, content: base64Data, branch: githubBranch }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (syncResponse.ok) { isRemoteSynced = true; }
        else { const err = await syncResponse.json().catch(() => ({})); fallbackCommitError = err.message || syncResponse.statusText; }
      } catch (e: any) { fallbackCommitError = e.message; }
    }

    const returnedUrl = isRemoteSynced ? \`https://raw.githubusercontent.com/\${githubOwner}/\${githubRepo}/\${githubBranch}/public/uploads/\${finalFilename}\` : uploadedRelativeUrl;
    return NextResponse.json({ success: true, url: returnedUrl, filename: finalFilename, githubSynced: isRemoteSynced, githubError: fallbackCommitError || undefined });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(apiDir, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log(\`Created \${fullPath}\`);
}
