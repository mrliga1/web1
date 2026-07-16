import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { verifyAdmin } from '../lib/auth';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { name, base64 } = await req.json();
    if (typeof base64 !== 'string') {
      return NextResponse.json({ error: 'Thiếu dữ liệu ảnh' }, { status: 400 });
    }

    const matches = base64.match(/^data:(image\/(?:avif|gif|jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Định dạng ảnh không hợp lệ' }, { status: 400 });
    }

    const mimeType = matches[1];
    const binaryData = Buffer.from(matches[2], 'base64');
    if (!IMAGE_EXTENSIONS[mimeType] || binaryData.length === 0 || binaryData.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Ảnh không hợp lệ hoặc vượt quá 10 MB' }, { status: 400 });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      return NextResponse.json({ error: 'Máy chủ chưa được cấu hình Cloudflare R2' }, { status: 503 });
    }

    const originalName = typeof name === 'string' ? path.parse(name).name : 'img';
    const safeName = originalName.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 80) || 'img';
    const finalFilename = `${safeName}-${Date.now()}.${IMAGE_EXTENSIONS[mimeType]}`;
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: finalFilename,
      Body: binaryData,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    const returnedUrl = `${publicUrl.replace(/\/$/, '')}/${finalFilename}`;
    return NextResponse.json({ success: true, url: returnedUrl, filename: finalFilename });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tải ảnh lên';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
