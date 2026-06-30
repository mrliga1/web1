import { NextResponse } from 'next/server';
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
