import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyAdmin } from '../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'Thiếu đường dẫn ảnh (url)' }, { status: 400 });

    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
    const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || '';

    // Extract filename from URL
    let filename = url;
    if (url.startsWith(publicUrl)) {
      filename = url.replace(publicUrl + '/', '');
    } else {
      // In case the URL is a relative path or another format, try to get the last segment
      try {
        const urlObj = new URL(url);
        filename = urlObj.pathname.split('/').pop() || '';
      } catch (e) {
        filename = url.split('/').pop() || '';
      }
    }

    if (!filename) {
      return NextResponse.json({ error: 'Không thể trích xuất tên file từ URL' }, { status: 400 });
    }

    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    await S3.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filename,
    }));

    return NextResponse.json({ success: true, message: `Đã xóa file ${filename} thành công.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
