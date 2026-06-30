import { NextResponse } from 'next/server';
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
    const files = getFiles(srcDir).map(f => f.replace(srcDir + path.sep, '').replace(/\\/g, '/'));
    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
