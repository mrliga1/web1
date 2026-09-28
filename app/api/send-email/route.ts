import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { verifyStaff } from '../lib/auth';
import { createServiceRoleClient } from '../../../src/lib/serverSupabase';
import { isLeadAssignedTo } from '../../../src/lib/crmAccess';

export const runtime = 'nodejs';

function cleanText(value: unknown, maxLength = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  const authResult = await verifyStaff(req);
  if (!authResult.authorized || !authResult.profile || !['admin', 'editor'].includes(authResult.profile.role)) {
    return NextResponse.json({ error: 'Không có quyền gửi thông báo phân công.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { leadId?: unknown; email?: unknown } | null;
  const leadId = cleanText(body?.leadId, 200);
  const email = cleanText(body?.email, 320).toLowerCase();
  if (!leadId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Thông tin phân công không hợp lệ.' }, { status: 400 });
  }

  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  if (!smtpUser || !smtpPass) {
    return NextResponse.json({ error: 'Máy chủ chưa được cấu hình email.' }, { status: 503 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('consultations')
      .select('id,data').eq('id', leadId).maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng.' }, { status: 404 });
    }

    const lead = (data.data || {}) as Record<string, unknown>;
    if (!isLeadAssignedTo(lead.assignee, email)) {
      return NextResponse.json({ error: 'Người nhận không khớp với nhân viên được giao.' }, { status: 409 });
    }
    const { data: staff, error: staffError } = await supabase.from('users')
      .select('uid,email,role').eq('email', email).maybeSingle();
    if (staffError) throw staffError;
    if (!staff || !['admin', 'editor', 'member'].includes(String(staff.role))) {
      return NextResponse.json({ error: 'Email được giao chưa thuộc nhân viên CRM.' }, { status: 409 });
    }

    const name = escapeHtml(cleanText(lead.name, 120) || 'Khách hàng');
    const phone = escapeHtml(cleanText(lead.phone, 30) || 'Chưa cung cấp');
    const propertyTitle = escapeHtml(cleanText(lead.propertyTitle, 200) || 'Chưa xác định');
    const demand = escapeHtml(cleanText(lead.message || lead.demand, 2000) || 'Chưa cung cấp').replace(/\n/g, '<br/>');
    const sourceUrl = cleanText(lead.sourceUrl, 500);
    const safeSourceUrl = /^https:\/\/greeniahomes\.vn(?:\/|$)/i.test(sourceUrl)
      ? escapeHtml(sourceUrl)
      : '';

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      auth: { user: smtpUser, pass: smtpPass },
    });
    try {
      await transporter.sendMail({
        from: `"Greenia Homes - CRM" <${smtpUser}>`,
        to: email,
        subject: `[CRM] Bạn được giao khách hàng: ${cleanText(lead.name, 120) || 'Khách hàng'}`,
        html: `
          <h2>Bạn được giao khách hàng mới</h2>
          <p>Đăng nhập CRM để xem và cập nhật tiến độ chăm sóc.</p>
          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:600px">
            <tr><td>Họ và tên</td><td>${name}</td></tr>
            <tr><td>Số điện thoại</td><td>${phone}</td></tr>
            <tr><td>Sản phẩm quan tâm</td><td>${propertyTitle}</td></tr>
            <tr><td>Nhu cầu</td><td>${demand}</td></tr>
            ${safeSourceUrl ? `<tr><td>Trang nguồn</td><td><a href="${safeSourceUrl}">${safeSourceUrl}</a></td></tr>` : ''}
          </table>
          <p><a href="https://greeniahomes.vn/admin?section=leads&amp;lead=${encodeURIComponent(leadId)}">Mở khách hàng trong CRM</a></p>
        `,
      });
    } finally {
      transporter.close();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Không thể gửi email phân công CRM:', error);
    return NextResponse.json({ error: 'Không thể gửi email phân công.' }, { status: 503 });
  }
}
