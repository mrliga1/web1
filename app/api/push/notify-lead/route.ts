import { NextRequest, NextResponse } from 'next/server';
import { notifyLeadStakeholders } from '../../../../src/lib/leadNotifications';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { consultationId?: string } | null;
  const consultationId = body?.consultationId?.trim() || '';
  if (!consultationId || consultationId.length > 200) {
    return NextResponse.json({ error: 'Mã khách hàng không hợp lệ' }, { status: 400 });
  }

  try {
    const result = await notifyLeadStakeholders(consultationId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Không thể thông báo khách hàng mới:', error);
    return NextResponse.json({ error: 'Không thể gửi thông báo' }, { status: 503 });
  }
}
