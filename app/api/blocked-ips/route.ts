import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdmin } from '../lib/auth';


const getPath = () => path.join(process.cwd(), 'blocked-ips.json');

export async function GET(req: NextRequest) {
  const authResult = await verifyAdmin(req);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const p = getPath();
  if (fs.existsSync(p)) {
    return NextResponse.json(JSON.parse(fs.readFileSync(p, 'utf8')));
  }
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const { ips } = await req.json();
    fs.writeFileSync(getPath(), JSON.stringify(ips, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
