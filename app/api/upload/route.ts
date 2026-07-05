import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { name, base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: 'Missing base64' }, { status: 400 });

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let base64Data = base64;
    let fileExtension = 'png';
    let mimeType = 'image/png';
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
      fileExtension = mimeType.split('/')[1] || 'png';
    }

    const originalRefName = name ? path.parse(name).name : 'img';
    const sanitisedFilename = originalRefName.replace(/[^a-zA-Z0-9-_]/g, '');
    const finalFilename = `${sanitisedFilename}-${Date.now()}.${fileExtension}`;
    
    const binaryData = Buffer.from(base64Data, 'base64');
    const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || '';
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    await S3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: finalFilename,
      Body: binaryData,
      ContentType: mimeType,
    }));

    const returnedUrl = `${publicUrl}/${finalFilename}`;
    return NextResponse.json({ success: true, url: returnedUrl, filename: finalFilename });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
