import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getEnv } from '../../lib/env';
import { createServiceRoleClient } from '../../../../src/lib/serverSupabase';
import { releasePushEvent, reservePushEvent, sendPushNotifications } from '../../../../src/lib/webPushServer';

export const runtime = 'nodejs';

function cleanText(value: unknown, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    const lead = (data.data || {}) as {
      name?: string;
      phone?: string;
      email?: string;
      message?: string;
      demand?: string;
      source?: string;
      sourceUrl?: string;
      propertyTitle?: string;
    };
    const detail = cleanText(lead.propertyTitle || lead.source || 'Website Greenia Homes', 200);

    let emailSent = false;
    let emailDuplicate = false;
    const emailEventKey = `lead-email:${consultationId}`;
    if (await reservePushEvent(emailEventKey)) {
      try {
        const smtpUser = getEnv('SMTP_USER');
        const smtpPass = getEnv('SMTP_PASS');
        const smtpTo = getEnv('SMTP_TO') || 'thuannguyen.pigroup@gmail.com';
        if (!smtpUser || !smtpPass) throw new Error('Máy chủ chưa được cấu hình SMTP');

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
        });
        const sourceUrl = cleanText(lead.sourceUrl, 500);
        const safeSourceUrl = /^https?:\/\//i.test(sourceUrl) ? escapeHtml(sourceUrl) : '';
        await transporter.sendMail({
          from: `"Greenia Homes - Web System" <${smtpUser}>`,
          to: smtpTo,
          subject: `[Greenia Homes] Khách hàng mới - ${cleanText(lead.name, 120) || 'Chưa có tên'}`,
          html: `
            <h2>Yêu cầu tư vấn bất động sản mới</h2>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px">
              <tr><td style="font-weight:bold">Họ và tên</td><td>${escapeHtml(cleanText(lead.name, 120) || 'Chưa cung cấp')}</td></tr>
              <tr><td style="font-weight:bold">Số điện thoại</td><td>${escapeHtml(cleanText(lead.phone, 30) || 'Chưa cung cấp')}</td></tr>
              <tr><td style="font-weight:bold">Email</td><td>${escapeHtml(cleanText(lead.email, 160) || 'Chưa cung cấp')}</td></tr>
              <tr><td style="font-weight:bold">Nhu cầu</td><td>${escapeHtml(cleanText(lead.message || lead.demand || detail, 2000)).replace(/\n/g, '<br/>')}</td></tr>
              <tr><td style="font-weight:bold">Nguồn</td><td>${safeSourceUrl ? `<a href="${safeSourceUrl}">${safeSourceUrl}</a>` : 'Website Greenia Homes'}</td></tr>
            </table>
          `,
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Không thể gửi email khách hàng mới:', emailError);
        await releasePushEvent(emailEventKey).catch((releaseError) => {
          console.error('Không thể mở khóa gửi lại email khách hàng:', releaseError);
        });
      }
    } else {
      emailDuplicate = true;
    }

    let pushResult: Record<string, unknown> = { duplicate: true };
    const pushEventKey = `lead:${consultationId}`;
    if (await reservePushEvent(pushEventKey)) {
      try {
        pushResult = await sendPushNotifications({
          title: 'Khách hàng mới',
          body: `${lead.name || 'Khách hàng'} vừa gửi yêu cầu từ ${detail}.`,
          url: '/admin?section=leads',
          tag: `lead-${consultationId}`,
        }, { roles: ['admin', 'editor'] });
      } catch (pushError) {
        console.error('Không thể phát Web Push khách hàng mới:', pushError);
        await releasePushEvent(pushEventKey).catch((releaseError) => {
          console.error('Không thể mở khóa gửi lại Web Push khách hàng:', releaseError);
        });
        pushResult = { sent: 0, pushError: true };
      }
    }
    return NextResponse.json({ success: true, emailSent, emailDuplicate, ...pushResult });
  } catch (error) {
    console.error('Không thể phát Web Push khách hàng mới:', error);
    return NextResponse.json({ error: 'Không thể gửi thông báo' }, { status: 503 });
  }
}
