import { NextRequest, NextResponse } from 'next/server';
import { getEnv, getDecodedGithubToken } from '../lib/firebase-admin';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { name, base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: 'Missing base64' }, { status: 400 });

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let base64Data = base64;
    let fileExtension = 'png';
    if (matches && matches.length === 3) {
      base64Data = matches[2];
      fileExtension = matches[1].split('/')[1] || 'png';
    }

    const originalRefName = name ? path.parse(name).name : 'img';
    const sanitisedFilename = originalRefName.replace(/[^a-zA-Z0-9-_]/g, '');
    const finalFilename = `${sanitisedFilename}-${Date.now()}.${fileExtension}`;
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    
    const targetFilePath = path.join(uploadsDir, finalFilename);
    const binaryData = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(targetFilePath, binaryData);

    const uploadedRelativeUrl = `/uploads/${finalFilename}`;

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
        const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/uploads/${finalFilename}`;
        const authHeaderValue = (githubToken.startsWith('ghp_') || githubToken.startsWith('github_pat_')) ? `token ${githubToken}` : `Bearer ${githubToken}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const syncResponse = await fetch(url, {
          method: 'PUT',
          headers: { 'Authorization': authHeaderValue, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Greenia-Homes-Uploader' },
          body: JSON.stringify({ message: `Upload ${finalFilename}`, content: base64Data, branch: githubBranch }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (syncResponse.ok) { isRemoteSynced = true; }
        else { const err = await syncResponse.json().catch(() => ({})); fallbackCommitError = err.message || syncResponse.statusText; }
      } catch (e: any) { fallbackCommitError = e.message; }
    }

    const returnedUrl = isRemoteSynced ? `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${githubBranch}/public/uploads/${finalFilename}` : uploadedRelativeUrl;
    return NextResponse.json({ success: true, url: returnedUrl, filename: finalFilename, githubSynced: isRemoteSynced, githubError: fallbackCommitError || undefined });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
