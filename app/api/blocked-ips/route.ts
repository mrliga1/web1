import { NextRequest, NextResponse } from 'next/server';
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
