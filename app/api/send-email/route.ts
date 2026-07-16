import fs from 'fs';
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getEnv } from '../lib/env';

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
  try {
    const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
    const blockedIpsPath = path.join(process.cwd(), 'blocked-ips.json');
    if (fs.existsSync(blockedIpsPath)) {
      const blocked = JSON.parse(fs.readFileSync(blockedIpsPath, 'utf8'));
      if (Array.isArray(blocked) && blocked.includes(ip)) {
        return NextResponse.json({ error: 'Địa chỉ IP đã bị chặn' }, { status: 403 });
      }
    }

    const payload = await req.json();
    const name = cleanText(payload.name, 120);
    const phone = cleanText(payload.phone, 30);
    const email = cleanText(payload.email, 160);
    const message = cleanText(payload.message, 2000);
    const propertyTitle = cleanText(payload.propertyTitle, 200);
    const sourceUrl = cleanText(payload.sourceUrl, 500);
    if (!name || !phone) {
      return NextResponse.json({ error: 'Thiếu họ tên hoặc số điện thoại' }, { status: 400 });
    }

    const smtpUser = getEnv('SMTP_USER');
    const smtpPass = getEnv('SMTP_PASS');
    const smtpTo = getEnv('SMTP_TO') || 'sales.greeniahomes@gmail.com';
    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Máy chủ chưa được cấu hình email' }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });
    const safeSourceUrl = /^https?:\/\//i.test(sourceUrl) ? escapeHtml(sourceUrl) : '';

    const info = await transporter.sendMail({
      from: `"Greenia Homes - Web System" <${smtpUser}>`,
      to: smtpTo,
      subject: `[Greenia Homes] Yêu cầu tư vấn - ${name} - ${propertyTitle}`,
      html: `
        <h2>Yêu cầu tư vấn bất động sản</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="background-color: #f8f9fa; font-weight: bold; width: 35%;">Họ và tên</td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Số điện thoại</td><td>${escapeHtml(phone)}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Email</td><td>${escapeHtml(email || 'Không cung cấp')}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Mối quan tâm</td><td>${escapeHtml(propertyTitle)}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Nguồn yêu cầu</td><td>${safeSourceUrl ? `<a href="${safeSourceUrl}">${safeSourceUrl}</a>` : 'Không cung cấp'}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Lời nhắn</td><td>${escapeHtml(message || 'Không có').replace(/\n/g, '<br/>')}</td></tr>
        </table>
        <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">Email được gửi tự động từ hệ thống website Greenia Homes.</p>
      `,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể gửi email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
