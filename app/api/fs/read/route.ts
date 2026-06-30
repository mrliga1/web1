import { NextRequest, NextResponse } from 'next/server';
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
