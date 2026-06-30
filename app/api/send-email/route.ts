import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '../lib/firebase-admin';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const blockedIpsPath = path.join(process.cwd(), 'blocked-ips.json');
    if (fs.existsSync(blockedIpsPath)) {
      const blocked = JSON.parse(fs.readFileSync(blockedIpsPath, 'utf8'));
      if (blocked.includes(ip)) {
        return NextResponse.json({ error: 'IP is blocked from sending emails' }, { status: 403 });
      }
    }

    const { name, phone, email, message, propertyTitle, sourceUrl } = await req.json();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: getEnv('SMTP_USER') || getEnv('VITE_SMTP_USER'),
        pass: getEnv('SMTP_PASS') || getEnv('VITE_SMTP_PASS')
      }
    });

    const mailOptions = {
      from: `"Greenia Homes - Web System" <${getEnv('SMTP_USER') || getEnv('VITE_SMTP_USER')}>`,
      to: 'thuankdbds@gmail.com',
      subject: `[Greenia Homes] Yêu Cầu Tư Vấn - ${name} - ${propertyTitle}`,
      html: `
        <h2>Yêu Cầu Tư Vấn Bất Động Sản</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="background-color: #f8f9fa; font-weight: bold; width: 35%;">Họ và tên</td><td>${name}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Số điện thoại</td><td><a href="tel:${phone}">${phone}</a></td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Email</td><td>${email || 'Không cung cấp'}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Mối quan tâm</td><td>${propertyTitle}</td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Nguồn yêu cầu</td><td><a href="${sourceUrl}">${sourceUrl}</a></td></tr>
          <tr><td style="background-color: #f8f9fa; font-weight: bold;">Lời nhắn</td><td>${message ? message.replace(/\n/g, '<br/>') : 'Không có'}</td></tr>
        </table>
        <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">Email được gửi tự động từ hệ thống website Greenia Homes.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
