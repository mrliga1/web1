import { NextRequest, NextResponse } from 'next/server';
import { verifyStaff } from '../../lib/auth';
import { createServiceRoleClient } from '../../../../src/lib/serverSupabase';
import { reservePushEvent, sendPushNotifications } from '../../../../src/lib/webPushServer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authResult = await verifyStaff(request);
  if (!authResult.authorized || !authResult.profile || !['admin', 'editor'].includes(authResult.profile.role)) {
    return NextResponse.json({ error: 'Không có quyền giao khách hàng' }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as { leadId?: string; email?: string } | null;
  const leadId = body?.leadId?.trim() || '';
  const email = body?.email?.trim().toLowerCase() || '';
  if (!leadId || leadId.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Dữ liệu giao khách không hợp lệ' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('consultations').select('id, data').eq('id', leadId).maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 });
    const eventKey = `assignment:${leadId}:${email}:${String((data.data as { assignee?: string })?.assignee || '')}`;
    if (!(await reservePushEvent(eventKey))) return NextResponse.json({ success: true, duplicate: true });

    const lead = (data.data || {}) as { name?: string; propertyTitle?: string };
    const result = await sendPushNotifications({
      title: 'Bạn được giao khách hàng mới',
      body: `${lead.name || 'Khách hàng'}${lead.propertyTitle ? ` – ${lead.propertyTitle}` : ''}.`,
      url: `/admin?section=leads&lead=${encodeURIComponent(leadId)}`,
      tag: `assignment-${leadId}`,
    }, { email });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Không thể phát Web Push giao khách:', error);
    return NextResponse.json({ error: 'Không thể gửi thông báo giao khách' }, { status: 503 });
  }
}
