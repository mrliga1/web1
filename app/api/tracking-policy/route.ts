import { NextRequest, NextResponse } from 'next/server';
import { getBlockedIpsForRequest, getClientIp, isBlockedIp } from '../lib/blockedIps';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Chỉ trả trạng thái của lượt truy cập hiện tại, không công khai IP hoặc danh sách chặn.
export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store, max-age=0' };
  try {
    const ips = await getBlockedIpsForRequest({ strict: true });
    return NextResponse.json({ blocked: isBlockedIp(getClientIp(request), ips) }, { headers });
  } catch {
    return NextResponse.json({ error: 'Chưa xác minh được chính sách theo dõi' }, { status: 503, headers });
  }
}
