import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { url } = await req.json();
    if (typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Thiếu đường dẫn ảnh' }, { status: 400 });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    const publicUrl = (process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      return NextResponse.json({ error: 'Máy chủ chưa được cấu hình Cloudflare R2' }, { status: 503 });
    }

    if (!url.startsWith(`${publicUrl}/`)) {
      return NextResponse.json({ success: true, skipped: true, message: 'Ảnh không thuộc Cloudflare R2 hiện tại' });
    }

    const filename = decodeURIComponent(url.slice(publicUrl.length + 1));
    if (!filename || filename.includes('..') || filename.startsWith('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Đường dẫn ảnh không hợp lệ' }, { status: 400 });
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: filename }));

    return NextResponse.json({ success: true, message: `Đã xóa file ${filename}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xóa ảnh';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
