import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const MAX_REQUEST_SIZE = 4.25 * 1024 * 1024;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_UPLOADS = 10;
const uploadAttempts = new Map<string, number[]>();

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isAllowedSource(req: NextRequest) {
  const source = req.headers.get('origin') || req.headers.get('referer');
  if (!source) return false;

  try {
    const hostname = new URL(source).hostname.toLowerCase();
    const configuredHostname = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase()
      : '';
    return hostname === 'greeniahomes.vn'
      || hostname === 'www.greeniahomes.vn'
      || hostname === configuredHostname
      || hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function isRateLimited(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientId = forwardedFor || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const recentAttempts = (uploadAttempts.get(clientId) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW,
  );

  if (recentAttempts.length >= RATE_LIMIT_UPLOADS) {
    uploadAttempts.set(clientId, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  uploadAttempts.set(clientId, recentAttempts);
  if (uploadAttempts.size > 1000) uploadAttempts.clear();
  return false;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAllowedSource(req)) {
      return NextResponse.json({ error: 'Nguồn tải ảnh không hợp lệ' }, { status: 403 });
    }
    if (isRateLimited(req)) {
      return NextResponse.json({ error: 'Bạn đã tải quá nhiều ảnh, vui lòng thử lại sau' }, { status: 429 });
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: 'Ảnh vượt quá 3 MB' }, { status: 413 });
    }

    const { name, base64 } = await req.json();
    if (typeof base64 !== 'string') {
      return NextResponse.json({ error: 'Thiếu dữ liệu ảnh' }, { status: 400 });
    }

    const matches = base64.match(/^data:(image\/(?:avif|jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Định dạng ảnh không hợp lệ' }, { status: 400 });
    }

    const mimeType = matches[1];
    const binaryData = Buffer.from(matches[2], 'base64');
    if (!IMAGE_EXTENSIONS[mimeType] || binaryData.length === 0 || binaryData.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Ảnh không hợp lệ hoặc vượt quá 3 MB' }, { status: 400 });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      return NextResponse.json({ error: 'Máy chủ chưa được cấu hình Cloudflare R2' }, { status: 503 });
    }

    const originalName = typeof name === 'string' ? path.parse(name).name : 'anh-lien-he';
    const safeName = originalName.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 60) || 'anh-lien-he';
    const now = new Date();
    const key = `consultations/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${safeName}-${randomUUID()}.${IMAGE_EXTENSIONS[mimeType]}`;
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: binaryData,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    return NextResponse.json({
      success: true,
      url: `${publicUrl.replace(/\/$/, '')}/${key}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tải ảnh lên';
    console.error('Lỗi tải ảnh liên hệ:', message);
    return NextResponse.json({ error: 'Không thể tải ảnh lên' }, { status: 500 });
  }
}
