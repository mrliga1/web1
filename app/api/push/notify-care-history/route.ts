import { NextRequest, NextResponse } from 'next/server';
import { verifyStaff } from '../../lib/auth';
import { createServiceRoleClient } from '../../../../src/lib/serverSupabase';
import { releasePushEvent, reservePushEvent, sendPushNotifications } from '../../../../src/lib/webPushServer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authResult = await verifyStaff(request);
  if (!authResult.authorized || !authResult.profile) {
    return NextResponse.json({ error: authResult.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    leadId?: string;
    historyTime?: number;
  } | null;
  const leadId = body?.leadId?.trim() || '';
  const historyTime = Number(body?.historyTime);
  if (!leadId || leadId.length > 200 || !Number.isFinite(historyTime)) {
    return NextResponse.json({ error: 'Dữ liệu lịch sử chăm sóc không hợp lệ' }, { status: 400 });
  }

  // Chỉ phát cảnh báo quản trị khi nhân viên cập nhật lịch sử chăm sóc.
  if (authResult.profile.role !== 'member') {
    return NextResponse.json({ success: true, skipped: true });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('consultations')
      .select('id, data')
      .eq('id', leadId)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    const eventKey = `care:${leadId}:${historyTime}`;
    if (!(await reservePushEvent(eventKey))) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const lead = (data.data || {}) as { name?: string; propertyTitle?: string };
    let result: Record<string, unknown>;
    try {
      result = await sendPushNotifications({
        title: 'Lịch sử chăm sóc vừa được cập nhật',
        body: `${authResult.profile.email} vừa cập nhật ${lead.name || 'khách hàng'}${lead.propertyTitle ? ` – ${lead.propertyTitle}` : ''}.`,
        url: `/admin?section=leads&lead=${encodeURIComponent(leadId)}`,
        tag: `care-${leadId}`,
      }, { roles: ['admin', 'editor'] });
    } catch (pushError) {
      await releasePushEvent(eventKey).catch((releaseError) => {
        console.error('Không thể mở khóa thông báo lịch sử chăm sóc:', releaseError);
      });
      throw pushError;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Không thể phát Web Push lịch sử chăm sóc:', error);
    return NextResponse.json({ error: 'Không thể gửi thông báo lịch sử chăm sóc' }, { status: 503 });
  }
}
