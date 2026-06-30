import { NextRequest, NextResponse } from 'next/server';
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
      envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT_BASE64=.*/g, `FIREBASE_SERVICE_ACCOUNT_BASE64=${base64Json}`);
    } else {
      envContent += `\nFIREBASE_SERVICE_ACCOUNT_BASE64=${base64Json}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    initFirebaseAdmin();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
