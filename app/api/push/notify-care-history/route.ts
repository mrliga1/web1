import { NextRequest, NextResponse } from 'next/server';
import { verifyStaff } from '../../lib/auth';
import { createServiceRoleClient } from '../../../../src/lib/serverSupabase';
import { isLeadAssignedTo } from '../../../../src/lib/crmAccess';
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
    eventType?: 'care' | 'status';
    status?: string;
  } | null;
  const leadId = body?.leadId?.trim() || '';
  const historyTime = Number(body?.historyTime);
  if (!leadId || leadId.length > 200 || !Number.isFinite(historyTime)) {
    return NextResponse.json({ error: 'Dữ liệu lịch sử chăm sóc không hợp lệ' }, { status: 400 });
  }

  // Admin không cần nhận lại cảnh báo do chính mình tạo.
  if (!['member', 'editor'].includes(authResult.profile.role)) {
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

    const lead = (data.data || {}) as {
      name?: string;
      propertyTitle?: string;
      assignee?: string;
      status?: string;
      careHistory?: Array<{ time?: number; author?: string }>;
    };
    if (authResult.profile.role === 'member' && !isLeadAssignedTo(lead.assignee, authResult.profile.email)) {
      return NextResponse.json({ error: 'Bạn không được giao khách hàng này' }, { status: 403 });
    }
    const eventType = body?.eventType === 'status' ? 'status' : 'care';
    if (eventType === 'care' && !lead.careHistory?.some((entry) => Number(entry.time) === historyTime)) {
      return NextResponse.json({ error: 'Lịch sử chăm sóc chưa được lưu' }, { status: 409 });
    }
    if (eventType === 'status' && body?.status !== lead.status) {
      return NextResponse.json({ error: 'Trạng thái khách hàng chưa được lưu' }, { status: 409 });
    }
    const eventKey = `${eventType}:${leadId}:${historyTime}`;
    if (!(await reservePushEvent(eventKey))) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    let result: Record<string, unknown>;
    try {
      result = await sendPushNotifications({
        title: eventType === 'status' ? 'Trạng thái khách hàng vừa thay đổi' : 'Lịch sử chăm sóc vừa được cập nhật',
        body: eventType === 'status'
          ? `${authResult.profile.email} chuyển ${lead.name || 'khách hàng'} sang trạng thái ${lead.status || 'mới'}.`
          : `${authResult.profile.email} vừa cập nhật ${lead.name || 'khách hàng'}${lead.propertyTitle ? ` – ${lead.propertyTitle}` : ''}.`,
        url: `/admin?section=leads&lead=${encodeURIComponent(leadId)}`,
        tag: `${eventType}-${leadId}`,
      }, { roles: ['admin'] });
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
