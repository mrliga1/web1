import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdmin } from '../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { token, owner, repo, branch } = await req.json();
    if (!token || !owner || !repo) return NextResponse.json({ error: 'Missing token, owner or repo' }, { status: 400 });

    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const setEnv = (key: string, val: string) => {
      if (envContent.includes(`${key}=`)) {
        envContent = envContent.replace(new RegExp(`${key}=.*\\n?`, 'g'), `${key}='${val}'\n`);
      } else {
        envContent += `\n${key}='${val}'\n`;
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
