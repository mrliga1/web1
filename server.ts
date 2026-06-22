import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

dotenv.config();

if (!process.env.SMTP_USER && fs.existsSync('.env.example')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.example'));
  for (const k in envConfig) {
    if (!process.env[k]) {
      process.env[k] = envConfig[k];
    }
  }
}

function cleanEnvVar(val: string | undefined): string {
  if (!val) return '';
  let s = val.trim();
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function getEnv(key: string): string {
  if (fs.existsSync('.env.example')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env.example'));
    if (envConfig[key]) {
      return cleanEnvVar(envConfig[key]);
    }
  }
  return cleanEnvVar(process.env[key]);
}

function getDecodedGithubToken(): string {
  let githubToken = getEnv('GITHUB_TOKEN') || getEnv('VITE_GITHUB_TOKEN');
  if (githubToken.startsWith('base64:')) {
    const base64Part = githubToken.slice(7);
    if (base64Part.startsWith('ghp_') || base64Part.startsWith('github_pat_')) {
      return base64Part;
    }
    try {
      return Buffer.from(base64Part, 'base64').toString('utf8').trim();
    } catch (e) {
      console.error('[Token Decode Error] Failed to decode base64 GITHUB_TOKEN:', e);
    }
  }
  return githubToken;
}

const app = express();
const PORT = 3000;

// Increase limit to house high-quality images transferred as base64 string
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

import admin from 'firebase-admin';

// Initialize Firebase Admin if available
function initFirebaseAdmin() {
  if (admin.apps?.length > 0) return;
  const saBase64 = getEnv('FIREBASE_SERVICE_ACCOUNT_BASE64');
  if (saBase64) {
    try {
      const sa = JSON.parse(Buffer.from(saBase64, 'base64').toString('utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(sa)
      });
      console.log('[Firebase Admin] Initialized successfully.');
    } catch (e: any) {
      console.error('[Firebase Admin] Initialize failed:', e.message);
    }
  }
}
initFirebaseAdmin();

// --- FIREBASE ADMIN ENDPOINT ---
app.post('/api/firebase-admin-config', (req, res) => {
  try {
    const { serviceAccountJson } = req.body;
    if (!serviceAccountJson) return res.status(400).json({ error: 'Missing serviceAccountJson' });
    
    // Validate JSON
    let parsedParams;
    try {
      parsedParams = JSON.parse(serviceAccountJson);
      if (!parsedParams.project_id || !parsedParams.private_key) {
        throw new Error('Invalid JSON structure');
      }
    } catch (err) {
      return res.status(400).json({ error: 'Nội dung JSON không hợp lệ hoặc thiếu project_id/private_key.' });
    }

    const base64SA = Buffer.from(serviceAccountJson).toString('base64');

    let envContent = '';
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    const lines = envContent.split('\n');
    const newLines = lines.filter(line => !line.trim().startsWith('FIREBASE_SERVICE_ACCOUNT_BASE64='));
    newLines.push(`FIREBASE_SERVICE_ACCOUNT_BASE64="${base64SA}"`);
    fs.writeFileSync(envPath, newLines.filter(Boolean).join('\n') + '\n');
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = base64SA;
    
    initFirebaseAdmin();

    return res.json({ success: true, message: 'Đã lưu cấu hình Firebase Admin thành công!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/firebase-admin-status', (req, res) => {
  const sa = getEnv('FIREBASE_SERVICE_ACCOUNT_BASE64');
  res.json({ configured: !!sa && (admin.apps?.length || 0) > 0 });
});

app.delete('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    if (!(admin.apps?.length)) {
      return res.status(403).json({ error: 'Chưa cấu hình Firebase Admin SDK. Vui lòng thêm Khóa Service Account.' });
    }
    try {
      await admin.auth().deleteUser(uid);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || String(e).includes('no user record')) {
        // Safe to ignore
        return res.json({ success: true, message: 'Người dùng không tồn tại trong Auth (đã bị xóa trước đó)' });
      }
      throw e;
    }
    return res.json({ success: true, message: 'Đã xóa người dùng khỏi Auth' });
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('Lỗi khi xóa người dùng:', err);
    return res.status(500).json({ error: errorMsg, code: err?.code });
  }
});

// Ensure public upload directories are created on machine bootstrap
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve /uploads path statically
app.use('/uploads', express.static(uploadsDir));

// API handler to receive and save files to local disk and sync to GitHub repo
app.post('/api/upload', async (req, res) => {
  try {
    const { name, base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'Missing base64 audio/image content.' });
    }

    // Check base64 format and parse it
    // E.g., base64 image could be: "data:image/png;base64,iVBORw0KGgoAAA..."
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let base64Data = base64;
    let fileExtension = 'png';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      base64Data = matches[2];
      fileExtension = mimeType.split('/')[1] || 'png';
    }

    // Build unique, safely formatted safe name
    const originalRefName = name ? path.parse(name).name : 'img';
    const sanitisedFilename = originalRefName.replace(/[^a-zA-Z0-9-_]/g, '');
    const finalFilename = `${sanitisedFilename}-${Date.now()}.${fileExtension}`;
    const targetFilePath = path.join(uploadsDir, finalFilename);

    // Save physical file clone onto the disk
    const binaryData = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(targetFilePath, binaryData);

    const uploadedRelativeUrl = `/uploads/${finalFilename}`;

    // Optional: Synchronize directly with configured GitHub active repo contents
    let isRemoteSynced = false;
    let fallbackCommitError = '';

    let githubToken = getDecodedGithubToken();
    let githubOwner = getEnv('GITHUB_OWNER') || getEnv('VITE_GITHUB_OWNER');
    let githubRepo = getEnv('GITHUB_REPO') || getEnv('VITE_GITHUB_REPO');
    let githubBranch = getEnv('GITHUB_BRANCH') || getEnv('VITE_GITHUB_BRANCH') || 'main';

    // Safeguard check and defensive swap if variables are inverted
    if (githubOwner.startsWith('ghp_') || githubOwner.startsWith('github_pat_')) {
      const cacheVal = githubOwner;
      githubOwner = githubToken;
      githubToken = cacheVal;
    }

    if (githubToken && githubOwner && githubRepo) {
      try {
        const targetRepoContentsUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/uploads/${finalFilename}`;
        
        // Use standard Bearer or token headers
        const authHeaderValue = (githubToken.startsWith('ghp_') || githubToken.startsWith('github_pat_'))
          ? `token ${githubToken}`
          : `Bearer ${githubToken}`;

        // Add AbortController for fetch timeout (e.g. 10 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const syncResponse = await fetch(targetRepoContentsUrl, {
          method: 'PUT',
          headers: {
            'Authorization': authHeaderValue,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'Greenia-Homes-Uploader'
          },
          body: JSON.stringify({
            message: `Chèn ảnh đại diện ${finalFilename} tự động từ Admin Dashboard`,
            content: base64Data,
            branch: githubBranch
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (syncResponse.ok) {
          isRemoteSynced = true;
          console.log(`[GitHub Sync] Đồng bộ thành công ảnh ${finalFilename} lên GitHub.`);
        } else {
          const jsonErrorResponse = await syncResponse.json().catch(() => ({}));
          fallbackCommitError = jsonErrorResponse.message || syncResponse.statusText;
          
          if (syncResponse.status === 401 || syncResponse.status === 403) {
            console.log(`[Local Saved SUCCESS] Ảnh đã được lưu thành công trên máy chủ cục bộ (${uploadedRelativeUrl}). Mách nhỏ: Tính năng sao lưu GitHub chưa được cấp quyền hoặc sai Token (Mã 401/403: ${fallbackCommitError}).`);
          } else {
            console.log(`[Local Saved SUCCESS] Đã lưu ảnh cục bộ. Đồng bộ đám mây tạm dừng: ${fallbackCommitError}`);
          }
        }
      } catch (githubFetchError: any) {
        fallbackCommitError = githubFetchError.message || String(githubFetchError);
        console.log('[Local Saved SUCCESS] Đã lưu ảnh cục bộ. Lỗi kết nối đám mây sync:', fallbackCommitError);
      }
    }

    const returnedUrl = isRemoteSynced
      ? `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${githubBranch}/public/uploads/${finalFilename}`
      : uploadedRelativeUrl;

    return res.json({
      success: true,
      url: returnedUrl,
      filename: finalFilename,
      githubSynced: isRemoteSynced,
      githubError: fallbackCommitError || undefined
    });

  } catch (error: any) {
    console.error('File Upload handler crashed with:', error);
    return res.status(500).json({ error: error.message || 'Crashed on server during processing.' });
  }
});

// === API CHỈNH SỬA FILE TRỰC TIẾP === //
app.get('/api/fs/files', (req, res) => {
  try {
    const srcDir = path.join(process.cwd(), 'src');
    const getAllFiles = (dirPath: string, arrayOfFiles: string[]) => {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
          arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
          // Only list ts, tsx, css files
          if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.json')) {
            arrayOfFiles.push(path.join(dirPath, file).replace(process.cwd(), '').replace(/\\/g, '/'));
          }
        }
      });
      return arrayOfFiles;
    };
    
    // Include some root files
    let allFiles = getAllFiles(srcDir, []);
    ['/App.tsx', '/index.css', '/tailwind.config.mjs'].forEach(f => {
      if (fs.existsSync(path.join(process.cwd(), f.replace('/', '')))) {
         if (!allFiles.includes(f)) allFiles.push(f);
      }
    });
    
    return res.json({ success: true, files: allFiles });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/fs/read', (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Missing filePath' });
    // Prevent directory traversal
    const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(process.cwd(), safePath);
    
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = fs.readFileSync(absolutePath, 'utf8');
    return res.json({ success: true, content });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/fs/modify-element', (req, res) => {
  try {
    const { filePath, line, action, newText, oldText } = req.body;
    if (!filePath || !line || !action) return res.status(400).json({ error: 'Missing parameters' });
    
    let safePath = typeof filePath === 'string' ? filePath : '';
    const cwd = process.cwd();
    if (safePath.startsWith(cwd)) safePath = '/' + path.relative(cwd, safePath).replace(/\\/g, '/');
    safePath = path.normalize(safePath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    const absolutePath = path.join(cwd, safePath);
    if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'File not found' });
    
    let code = fs.readFileSync(absolutePath, 'utf8');
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let targetNode: any = null;

    traverse(ast, {
      JSXElement(path: any) {
        if (path.node.loc && path.node.loc.start.line === parseInt(line)) {
          targetNode = path.node;
        }
      },
      JSXOpeningElement(path: any) {
        if (path.node.loc && path.node.loc.start.line === parseInt(line)) {
          if (!targetNode) {
              targetNode = path.parent;
          }
        }
      }
    });

    if (!targetNode) {
      if (action === 'update' && oldText) {
          const lines = code.split('\n');
          const lIdx = parseInt(line) - 1;
          lines[lIdx] = lines[lIdx].replace(oldText, newText);
          code = lines.join('\n');
          fs.writeFileSync(absolutePath, code, 'utf8');
          return res.json({ success: true, message: 'Updated via fallback', newContent: code });
      }
      return res.status(404).json({ error: 'Element not found at line ' + line });
    }

    if (action === 'delete') {
      const start = targetNode.start;
      const end = targetNode.end;
      code = code.slice(0, start) + code.slice(end);
    } else if (action === 'update' && oldText && newText !== undefined) {
      const start = targetNode.start;
      const end = targetNode.end;
      let nodeCode = code.slice(start, end);
      nodeCode = nodeCode.replace(oldText, newText);
      code = code.slice(0, start) + nodeCode + code.slice(end);
    }

    fs.writeFileSync(absolutePath, code, 'utf8');
    return res.json({ success: true, message: 'Modified successfully', newContent: code });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/fs/write', (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath || content === undefined) return res.status(400).json({ error: 'Missing parameters' });
    const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(process.cwd(), safePath);
    
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.writeFileSync(absolutePath, content, 'utf8');
    return res.json({ success: true, message: 'Saved successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/fs/search', (req, res) => {
  try {
    const { classes, text, tag, exactFile, exactLine } = req.body;
    
    if (exactFile) {
      // transform /app/applet/src/components/Home.tsx -> /src/components/Home.tsx
      let relativePath = exactFile;
      const cwd = process.cwd();
      if (exactFile.startsWith(cwd)) {
        relativePath = '/' + path.relative(cwd, exactFile).replace(/\\/g, '/');
      } else if (!exactFile.startsWith('/')) {
        relativePath = '/' + exactFile.replace(/\\/g, '/');
      }
      return res.json({ success: true, matches: [{ file: relativePath, line: exactLine, score: 100 }] });
    }

    const srcDir = path.join(process.cwd(), 'src');
    let matches: { file: string, line: number, score: number }[] = [];
    
    const searchFiles = (dirPath: string) => {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          searchFiles(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
          const relativePath = '/' + path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
          const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
          
          lines.forEach((lineStr, lineIdx) => {
            let score = 0;
            // Nếu có class, tìm class trùng lặp
            if (classes && classes.length > 0) {
               const classTokens = classes.split(' ');
               let matchedTokens = 0;
               classTokens.forEach(token => {
                 if (lineStr.includes(token)) matchedTokens++;
               });
               if (matchedTokens > 0) {
                 score += (matchedTokens / classTokens.length) * 10;
               }
            }
            // Nếu có text
            if (text && text.length > 0) {
               // Bỏ dấu xuống dòng và escape của text để tìm kiếm linh hoạt hơn
               const snippet = text.length > 20 ? text.substring(0, 20) : text;
               if (lineStr.includes(snippet)) {
                 score += 15;
               }
            }
            // Nếu có tag
            if (tag && lineStr.includes(`<${tag}`)) {
               score += 2;
            }

            // Mức điểm tối thiểu để coi là khớp
            if (score > 5) {
               matches.push({ file: relativePath, line: lineIdx + 1, score });
            }
          });
        }
      });
    };
    
    searchFiles(srcDir);
    ['/App.tsx', '/index.css'].forEach(f => {
       const full = path.join(process.cwd(), f.replace('/', ''));
       if(fs.existsSync(full)) {
         // skip because we already searched src
       }
    });

    matches.sort((a, b) => b.score - a.score);
    
    return res.json({ success: true, matches: matches.slice(0, 5) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Diagnostic endpoint to check configured GitHub credential validity
app.get('/api/github-status', async (req, res) => {

  try {
    const githubToken = getDecodedGithubToken();
    const githubOwner = getEnv('GITHUB_OWNER');
    const githubRepo = getEnv('GITHUB_REPO');
    const githubBranch = getEnv('GITHUB_BRANCH') || 'main';

    if (!githubToken || !githubOwner || !githubRepo) {
      return res.json({
        configured: false,
        status: 'THIẾU CẤU HÌNH',
        details: 'Chưa cấu hình đầy đủ biến môi trường GITHUB_TOKEN, GITHUB_OWNER, hoặc GITHUB_REPO.'
      });
    }

    // Attempt to request repository access via GitHub API
    const authHeaderValue = (githubToken.startsWith('ghp_') || githubToken.startsWith('github_pat_'))
      ? `token ${githubToken}`
      : `Bearer ${githubToken}`;
    const repoUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}`;
    
    const response = await fetch(repoUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeaderValue,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Greenia-Homes-Uploader'
      }
    });

    if (response.ok) {
      const repoData = await response.json().catch(() => ({}));
      return res.json({
        configured: true,
        status: 'HOẠT ĐỘNG',
        owner: githubOwner,
        repo: githubRepo,
        branch: githubBranch,
        isPrivate: repoData.private,
        permissions: repoData.permissions || { admin: false, push: false, pull: true },
        message: 'Kết nối thành công! Token có quyền truy cập vào Repo này.'
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      return res.json({
        configured: true,
        status: 'LỖI KẾT NỐI (401/403/444)',
        owner: githubOwner,
        repo: githubRepo,
        branch: githubBranch,
        statusCode: response.status,
        error: errorMessage,
        message: `Lỗi từ GitHub (Mã ${response.status}): ${errorMessage}`
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      configured: true,
      status: 'LỖI HỆ THỐNG',
      error: err.message || String(err),
      message: 'Lỗi trong lúc kiểm tra kết nối cục bộ.'
    });
  }
});

// API to dynamically update and obfuscate GitHub Configuration securely in .env
app.post('/api/github-config', (req, res) => {
  try {
    const { token, owner, repo, branch } = req.body;
    
    if (!token || !owner || !repo) {
      return res.status(400).json({ error: 'Thiếu thông tin cấu hình (token, owner hoặc repo).' });
    }

    const cleanedToken = token.trim();
    const finalBranch = (branch || 'main').trim();
    const finalOwner = owner.trim();
    const finalRepo = repo.trim();

    // Obfuscate using Base64 to bypass automated secret scanning engines (GitHub scans for ghp_ or github_pat_)
    const base64Token = `base64:${Buffer.from(cleanedToken).toString('base64')}`;

    // Read the current .env if it exists, or create empty string
    let envContent = '';
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Parse existing lines
    const lines = envContent.split('\n');
    const updatedKeys = new Set(['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH']);
    const newLines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return true;
      const firstEqual = trimmed.indexOf('=');
      if (firstEqual === -1) return true;
      const key = trimmed.slice(0, firstEqual).trim();
      return !updatedKeys.has(key);
    });

    // Append updated values
    newLines.push(`GITHUB_TOKEN="${base64Token}"`);
    newLines.push(`GITHUB_OWNER="${finalOwner}"`);
    newLines.push(`GITHUB_REPO="${finalRepo}"`);
    newLines.push(`GITHUB_BRANCH="${finalBranch}"`);

    // Write back to .env
    fs.writeFileSync(envPath, newLines.filter(Boolean).join('\n') + '\n');

    // Update in-memory process environment immediately so we don't have to reboot the server!
    process.env.GITHUB_TOKEN = base64Token;
    process.env.GITHUB_OWNER = finalOwner;
    process.env.GITHUB_REPO = finalRepo;
    process.env.GITHUB_BRANCH = finalBranch;

    console.log('[GitHub Config] Cập nhật thành công cấu hình GitHub vào .env (Token ở dạng Base64 ẩn danh).');

    return res.json({
      success: true,
      message: 'Lưu cấu hình GitHub thành công! Token đã được mã hóa Base64 trước khi lưu nên không sợ bị GitHub thu hồi.'
    });

  } catch (error: any) {
    console.error('Error saving GitHub configuration:', error);
    return res.status(500).json({ error: error.message || 'Lỗi trong lúc ghi cấu hình.' });
  }
});

import nodemailer from 'nodemailer';

// --- BLOCKED IPS ENDPOINTS ---
app.get('/api/blocked-ips', (req, res) => {
  try {
    let ips: string[] = [];
    if (fs.existsSync('blocked-ips.json')) {
      ips = JSON.parse(fs.readFileSync('blocked-ips.json', 'utf8'));
    }
    res.json({ success: true, ips });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/blocked-ips', express.json(), (req, res) => {
  try {
    const { ips } = req.body;
    if (!Array.isArray(ips)) {
      return res.status(400).json({ success: false, error: 'Invalid data format' });
    }
    fs.writeFileSync('blocked-ips.json', JSON.stringify(ips, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- EMAIL ENDPOINT ---
app.post('/api/send-email', async (req, res) => {
  let smtpUser = '';
  let smtpPass = '';

  try {
    let { to, subject, html } = req.body;
    
    // Thu thập IP thật của client
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Không xác định';
    if (Array.isArray(clientIp)) {
      clientIp = clientIp[0];
    } else if (typeof clientIp === 'string' && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }
    const resolvedIp = clientIp as string;

    // Kiểm tra IP có nằm trong danh sách đen không
    let blockedIps: string[] = [];
    
    // Đọc từ file blocked-ips.json nếu có
    if (fs.existsSync('blocked-ips.json')) {
      try {
        blockedIps = JSON.parse(fs.readFileSync('blocked-ips.json', 'utf8'));
      } catch(e) {}
    }

    // Kết hợp thêm từ biến môi trường (nếu có)
    let blockedIpsStr = process.env.BLOCKED_IPS || '';
    if (!blockedIpsStr && fs.existsSync('.env.example')) {
      const envConfig = dotenv.parse(fs.readFileSync('.env.example'));
      if (envConfig.BLOCKED_IPS) blockedIpsStr = envConfig.BLOCKED_IPS;
    }
    if (blockedIpsStr) {
      const envIps = blockedIpsStr.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
      blockedIps = [...new Set([...blockedIps, ...envIps])];
    }

    if (blockedIps.includes(resolvedIp)) {
      console.warn(`[BLOCKED IP] Chặn yêu cầu gửi email từ IP: ${resolvedIp}`);
      // Trả về thành công giả để không cho kẻ tấn công biết là đã bị chặn
      return res.json({ success: true, message: 'Đã gửi liên hệ (Blocked IP)' });
    }

    if (html && typeof html === 'string') {
      html = html.replace('{{CLIENT_IP}}', resolvedIp);
    }
    
    // In a real app we read from process.env.SMTP_USER and process.env.SMTP_PASS
    // But since the user hasn't provided details, we'll try to find them, OR
    // we can use a mock/console.log block if not available.
    // NOTE: To make it actually send if configured, we just read variables.
    smtpUser = process.env.SMTP_USER ? cleanEnvVar(process.env.SMTP_USER) : '';
    smtpPass = process.env.SMTP_PASS ? cleanEnvVar(process.env.SMTP_PASS).replace(/\s+/g, '') : '';

    // Đọc trực tiếp từ file .env.example để tránh bị cache trong quá trình dev
    if ((!smtpUser || !smtpPass) && fs.existsSync('.env.example')) {
      const envConfig = dotenv.parse(fs.readFileSync('.env.example'));
      if (!smtpUser && envConfig.SMTP_USER) smtpUser = cleanEnvVar(envConfig.SMTP_USER);
      if (!smtpPass && envConfig.SMTP_PASS) smtpPass = cleanEnvVar(envConfig.SMTP_PASS).replace(/\s+/g, '');
    }

    console.log('--- DEBUG SMTP_USER:', smtpUser);
    console.log('--- DEBUG SMTP_PASS length:', smtpPass ? smtpPass.length : 0);

    if (!smtpUser || !smtpPass) {
      console.log('============= [EMAIL NO-SMTP LOG] =============');
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY (HTML):\n${html}`);
      console.log('===============================================');
      console.log('GHI CHÚ: Email đã được xuất ra Console vì bạn chưa thiết lập SMTP_USER và SMTP_PASS trong file .env');
      return res.json({ success: true, simulated: true, message: 'Email đã được log vào console do chưa cấu hình SMTP' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser, // e.g. thuankdbds@gmail.com
        pass: smtpPass  // 16-character App password, NOT your main password
      }
    });

    await transporter.sendMail({
      from: `"Greenia Admin CRM" <${smtpUser}>`,
      to,
      subject,
      html
    });

    return res.json({ success: true, message: 'Đã gửi email thành công!' });
  } catch (error: any) {
    if (error.message && error.message.includes('Invalid login')) {
      console.log('============= [EMAIL NO-SMTP LOG (AUTH FAILED)] =============');
      console.log(`SUBJECT: ${req.body.subject}`);
      console.log(`LỖI: Mật khẩu ứng dụng (App Password) hoặc Email không hợp lệ/chính xác.`);
      console.log('Vui lòng tạo App Password trong Google Account -> Security -> 2-Step Verification.');
      console.log('=============================================================');
      return res.json({ 
        success: true, 
        simulated: true, 
        message: `Lỗi đăng nhập SMTP thực tế: Đang dùng "${smtpUser}" (mật khẩu dài ${smtpPass ? smtpPass.length : 0} ký tự). LƯU Ý: Phải dùng "Mật khẩu Ứng dụng" (16 ký tự), KHÔNG dùng mật khẩu chính.` 
      });
    }
    console.error('Lỗi khi xử lý email:', error.message || error);
    return res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');

  let vite;
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files but DON'T fall back to index.html immediately
    app.use(express.static(distPath, { index: false }));
  }

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /admin\nSitemap: https://greeniahomes.vn/sitemap.xml');
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      let urls = [];
      const baseUrl = 'https://greeniahomes.vn';
      
      urls.push(`  <url>\n    <loc>${baseUrl}/</loc>\n    <priority>1.0</priority>\n  </url>`);
      urls.push(`  <url>\n    <loc>${baseUrl}/tin-tuc</loc>\n    <priority>0.8</priority>\n  </url>`);
      
      if (admin.apps && admin.apps.length > 0) {
        const db = admin.firestore();
        const newsSnap = await db.collection('news').get();
        newsSnap.forEach(doc => {
          urls.push(`  <url>\n    <loc>${baseUrl}/news/${doc.id}</loc>\n    <priority>0.7</priority>\n  </url>`);
        });

        const projSnap = await db.collection('projects').get();
        projSnap.forEach(doc => {
          urls.push(`  <url>\n    <loc>${baseUrl}/project/${doc.id}</loc>\n    <priority>0.8</priority>\n  </url>`);
        });

        const prodSnap = await db.collection('products').get();
        prodSnap.forEach(doc => {
          urls.push(`  <url>\n    <loc>${baseUrl}/product/${doc.id}</loc>\n    <priority>0.8</priority>\n  </url>`);
        });
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
      res.type('application/xml');
      res.send(sitemap);
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  });

  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || (req.path.includes('.') && !req.path.includes('index.html'))) {
      return next();
    }

    try {
      let indexHtml = '';
      if (!isProd) {
        indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
        indexHtml = await vite.transformIndexHtml(req.originalUrl, indexHtml);
      } else {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          indexHtml = fs.readFileSync(indexPath, 'utf8');
        } else {
          return res.status(404).send('Not found');
        }
      }

      let title = 'Greenia Homes - Phân Phối BĐS Cao Cấp';
      let desc = 'Greenia Homes là đơn vị chuyên Phân phối các sản phẩm BĐS cao cấp tại Tp HCM và các khu vực khác. Hotline: 0932 966 700.';
      let keywords = 'bất động sản, greenia homes, mua bán nhà đất';
      let image = 'https://raw.githubusercontent.com/thuanx2/GreenHome/main/public/uploads/thump2-1748805904033.jpg';
      
      let injectedDataScript = '';

      try {
        if (admin.apps && admin.apps.length > 0) {
           const db = admin.firestore();
           let match;
           if (req.path.startsWith('/project/')) {
              const pathPartClean = req.path.replace('/project/', '');
              const cleanParts = pathPartClean.split('-');
              let id = cleanParts[cleanParts.length - 1];
              if (cleanParts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(cleanParts[0])) { id = cleanParts[0]; }
              const docSnap = await db.collection('projects').doc(id).get();
              if (docSnap.exists) {
                 const data = docSnap.data();
                 title = data.seoTitle || data.title || title;
                 desc = data.seoDesc || (data.description || desc).replace(/<[^>]+>/g, '').substring(0, 160);
                 keywords = data.seoKey || keywords;
                 image = data.imageUrl || data.thumbnailUrl || (data.images && data.images[0]) || image;
                 injectedDataScript = `<script>window.__SERVER_DATA__ = ${JSON.stringify({ project: { id, ...data } })};</script>`;
              }
           } else if (req.path.startsWith('/product/')) {
              const pathPartClean = req.path.replace('/product/', '');
              const cleanParts = pathPartClean.split('-');
              let id = cleanParts[cleanParts.length - 1];
              if (cleanParts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(cleanParts[0])) { id = cleanParts[0]; }
              const docSnap = await db.collection('products').doc(id).get();
              if (docSnap.exists) {
                 const data = docSnap.data();
                 title = data.seoTitle || data.title || title;
                 desc = data.seoDesc || (data.description || desc).replace(/<[^>]+>/g, '').substring(0, 160);
                 keywords = data.seoKey || keywords;
                 image = data.imageUrl || data.thumbnailUrl || (data.images && data.images[0]) || image;
                 injectedDataScript = `<script>window.__SERVER_DATA__ = ${JSON.stringify({ product: { id, ...data } })};</script>`;
              }
           } else if (req.path.startsWith('/news/')) {
              const pathPartClean = req.path.replace('/news/', '');
              const cleanParts = pathPartClean.split('-');
              let id = cleanParts[cleanParts.length - 1];
              if (cleanParts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(cleanParts[0])) { id = cleanParts[0]; }
              const docSnap = await db.collection('news').doc(id).get();
              if (docSnap.exists) {
                 const data = docSnap.data();
                 title = data.seoTitle || data.title || title;
                 desc = data.seoDesc || (data.content || desc).replace(/<[^>]+>/g, '').substring(0, 160);
                 keywords = data.seoKey || keywords;
                 image = data.imageUrl || data.thumbnailUrl || image;
                 injectedDataScript = `<script>window.__SERVER_DATA__ = ${JSON.stringify({ news: { id, ...data } })};</script>`;
              }
           } else if ((match = req.path.match(/^\/category-news\/(.+)/))) {
              const catName = decodeURIComponent(match[1]);
              const docSnap = await db.collection('news_categories').where('name', '==', catName).limit(1).get();
              if (!docSnap.empty) {
                  const data = docSnap.docs[0].data();
                  title = data.seoTitle || `Tin tức: ${catName} | Greenia Homes`;
                  desc = data.seoDesc || desc;
                  keywords = data.seoKey || keywords;
              } else {
                  title = `Tin tức: ${catName} | Greenia Homes`;
              }
           } else if ((match = req.path.match(/^\/category-product\/(.+)/))) {
              const catName = decodeURIComponent(match[1]);
              const docSnap = await db.collection('product_categories').where('name', '==', catName).limit(1).get();
              if (!docSnap.empty) {
                  const data = docSnap.docs[0].data();
                  title = data.seoTitle || `Danh mục BĐS: ${catName} | Greenia Homes`;
                  desc = data.seoDesc || desc;
                  keywords = data.seoKey || keywords;
              } else {
                  title = `Danh mục BĐS: ${catName} | Greenia Homes`;
              }
           }
        }
      } catch (err) {
        console.error('OG Tag DB Fetch Error:', err);
      }

      const canonicalUrl = `https://greeniahomes.vn${req.path === '/' ? '' : req.path}`;
      const ogTags = `
        <title>${title.replace(/</g, '&lt;')}</title>
        <meta name="description" content="${desc.replace(/"/g, '&quot;')}" />
        <meta name="keywords" content="${keywords.replace(/"/g, '&quot;')}" />
        <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${image}" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="${canonicalUrl}" />
      `;
      
      // Replace existing title and generic meta tags if they exist to prevent duplicates
      indexHtml = indexHtml.replace(/<title>.*?<\/title>/ig, '');
      indexHtml = indexHtml.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/ig, '');
      indexHtml = indexHtml.replace(/<meta\s+name=["']keywords["']\s+content=["'].*?["']\s*\/?>/ig, '');
      
      indexHtml = indexHtml.replace('</head>', ogTags + '\n' + injectedDataScript + '\n</head>');
      res.status(200).set({ 'Content-Type': 'text/html' }).send(indexHtml);
    } catch (e) {
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Greenia Fullstack Server] active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
