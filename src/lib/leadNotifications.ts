import 'server-only';

import nodemailer from 'nodemailer';
import { createServiceRoleClient } from './serverSupabase';
import { releasePushEvent, reservePushEvent, sendPushNotifications } from './webPushServer';

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

async function reserveEventSafely(eventKey: string) {
  try {
    return await reservePushEvent(eventKey);
  } catch (error) {
    console.error(`Không thể khóa sự kiện ${eventKey}:`, error);
    return true;
  }
}

export async function notifyLeadStakeholders(consultationId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('consultations')
    .select('id, data')
    .eq('id', consultationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Không tìm thấy khách hàng');
  }

  const lead = (data.data || {}) as {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
    demand?: string;
    source?: string;
    sourceUrl?: string;
    propertyTitle?: string;
    spamStatus?: string;
    spamScore?: number;
  };
  const detail = cleanText(lead.propertyTitle || lead.source || 'Website Greenia Homes', 200);

  let emailSent = false;
  let emailDuplicate = false;
  const emailEventKey = `lead-email:${consultationId}`;
  if (await reserveEventSafely(emailEventKey)) {
    try {
      const smtpUser = process.env.SMTP_USER?.trim() || '';
      const smtpPass = process.env.SMTP_PASS?.trim() || '';
      const smtpTo = process.env.SMTP_TO?.trim() || 'thuankdbds@gmail.com';
      if (!smtpUser || !smtpPass) throw new Error('Máy chủ chưa được cấu hình SMTP');

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        auth: { user: smtpUser, pass: smtpPass },
      });
      const sourceUrl = cleanText(lead.sourceUrl, 500);
      const safeSourceUrl = /^https?:\/\//i.test(sourceUrl) ? escapeHtml(sourceUrl) : '';
      const spamStatus = cleanText(lead.spamStatus || 'clean', 20);
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
            <tr><td style="font-weight:bold">Sàng lọc</td><td>${escapeHtml(spamStatus)} (${Number(lead.spamScore) || 0} điểm)</td></tr>
          </table>
        `,
      }).finally(() => transporter.close());
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
  if (await reserveEventSafely(pushEventKey)) {
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

  return { emailSent, emailDuplicate, ...pushResult };
}
