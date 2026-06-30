import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function searchFiles(dir: string, pattern: string, results: any[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchFiles(filepath, pattern, results);
      }
    } else {
      const content = fs.readFileSync(filepath, 'utf8');
      if (content.includes(pattern)) {
        results.push({
          file: filepath.replace(path.join(process.cwd(), 'src') + path.sep, '').replace(/\\/g, '/'),
          matches: (content.match(new RegExp(pattern, 'g')) || []).length
        });
      }
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const { pattern } = await req.json();
    const srcDir = path.join(process.cwd(), 'src');
    const results = searchFiles(srcDir, pattern);
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
