import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '../lib/auth';

type ContentType = 'product' | 'project' | 'article';

const CONTENT_PATHS: Record<ContentType, string[]> = {
  product: [
    '/',
    '/san-pham',
    '/san-pham/[slug]',
    '/category-product/[name]',
    '/latest-sales',
    '/latest-rents',
  ],
  project: ['/', '/du-an', '/du-an/[slug]'],
  article: ['/', '/tin-tuc', '/tin-tuc/[slug]', '/category-news/[name]'],
};

export async function POST(req: NextRequest) {
  const authResult = await verifyAdmin(req);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await req.json() as { type?: ContentType };
    if (!body.type || !(body.type in CONTENT_PATHS)) {
      return NextResponse.json({ error: 'Loại nội dung không hợp lệ' }, { status: 400 });
    }

    revalidateTag('public-content');
    revalidateTag('home-page-data');
    CONTENT_PATHS[body.type].forEach((contentPath) => {
      revalidatePath(contentPath, 'page');
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể làm mới dữ liệu công khai';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
