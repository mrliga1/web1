import { NextRequest, NextResponse } from 'next/server';
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
