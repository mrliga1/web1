import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../../src/lib/serverSupabase';
import { reservePushEvent, sendPushNotifications } from '../../../../src/lib/webPushServer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { consultationId?: string } | null;
  const consultationId = body?.consultationId?.trim() || '';
  if (!consultationId || consultationId.length > 200) {
    return NextResponse.json({ error: 'Mã khách hàng không hợp lệ' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('consultations').select('id, data').eq('id', consultationId).maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 });
    if (!(await reservePushEvent(`lead:${consultationId}`))) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const lead = (data.data || {}) as { name?: string; source?: string; propertyTitle?: string };
    const detail = lead.propertyTitle || lead.source || 'Website Greenia Homes';
    const result = await sendPushNotifications({
      title: 'Khách hàng mới',
      body: `${lead.name || 'Khách hàng'} vừa gửi yêu cầu từ ${detail}.`,
      url: '/admin?section=leads',
      tag: `lead-${consultationId}`,
    }, { roles: ['admin', 'editor'] });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Không thể phát Web Push khách hàng mới:', error);
    return NextResponse.json({ error: 'Không thể gửi thông báo' }, { status: 503 });
  }
}
