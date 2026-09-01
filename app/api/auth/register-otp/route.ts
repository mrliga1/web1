import 'server-only';

import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { getBlockedIpsForRequest, getClientIp, isBlockedIp } from '../../lib/blockedIps';
import { getEnv } from '../../lib/env';
import { createServiceRoleClient } from '../../../../src/lib/serverSupabase';

export const runtime = 'nodejs';

const OTP_EXPIRES_MS = 10 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_SEND_REQUESTS = 5;
const MAX_VERIFY_REQUESTS = 10;

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type OtpChallenge = {
  version: 1;
  email: string;
  username: string;
  phone: string;
  expiresAt: number;
  salt: string;
  otpHash: string;
};

const rateLimits = new Map<string, RateLimitRecord>();

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeEmail(value: unknown): string {
  return cleanText(value, 160).toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: unknown): string {
  return cleanText(value, 30).replace(/[\s.()-]/g, '');
}

function isValidPhone(value: string): boolean {
  return /^\+?\d{9,15}$/.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isRateLimited(key: string, maximum: number): boolean {
  const now = Date.now();
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  rateLimits.set(key, current);
  return current.count > maximum;
}

function getChallengeSecret(): string {
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const smtpPassword = getEnv('SMTP_PASS');
  const secret = serviceRoleKey.length >= 40 ? serviceRoleKey : smtpPassword;
  if (secret.length < 16) {
    throw new Error('Máy chủ chưa được cấu hình khóa xác thực đăng ký');
  }
  return secret;
}

function createDigest(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function createChallenge(
  email: string,
  username: string,
  phone: string,
  otp: string,
): string {
  const secret = getChallengeSecret();
  const expiresAt = Date.now() + OTP_EXPIRES_MS;
  const salt = randomBytes(18).toString('base64url');
  const payload: OtpChallenge = {
    version: 1,
    email,
    username,
    phone,
    expiresAt,
    salt,
    otpHash: createDigest(`${email}:${otp}:${salt}:${expiresAt}`, secret),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${createDigest(encodedPayload, secret)}`;
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readChallenge(challenge: string): OtpChallenge | null {
  try {
    const [encodedPayload, signature, extra] = challenge.split('.');
    if (!encodedPayload || !signature || extra) return null;

    const expectedSignature = createDigest(encodedPayload, getChallengeSecret());
    if (!safeCompare(signature, expectedSignature)) return null;

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as Partial<OtpChallenge>;

    if (
      payload.version !== 1 ||
      !isValidEmail(payload.email || '') ||
      !isValidPhone(payload.phone || '') ||
      !payload.username ||
      typeof payload.expiresAt !== 'number' ||
      !payload.salt ||
      !payload.otpHash
    ) {
      return null;
    }

    return payload as OtpChallenge;
  } catch {
    return null;
  }
}

async function sendOtpEmail(email: string, username: string, otp: string) {
  const smtpUser = getEnv('SMTP_USER');
  const smtpPass = getEnv('SMTP_PASS');
  if (!smtpUser || !smtpPass) {
    throw new Error('Máy chủ chưa được cấu hình email OTP');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `"Greenia Homes" <${smtpUser}>`,
    to: email,
    subject: 'Mã xác thực đăng ký Greenia Homes',
    text: `Xin chào ${username}, mã OTP đăng ký của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17352d">
        <h2 style="color:#075c47">Xác thực tài khoản Greenia Homes</h2>
        <p>Xin chào ${escapeHtml(username)},</p>
        <p>Mã OTP đăng ký tài khoản của bạn là:</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:8px;color:#075c47">${otp}</p>
        <p>Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>
      </div>
    `,
  });
}

async function handleSend(req: NextRequest, payload: Record<string, unknown>) {
  const email = normalizeEmail(payload.email);
  const username = cleanText(payload.username, 80);
  const phone = normalizePhone(payload.phone);
  const ip = getClientIp(req);

  if (!email || !username || !phone) {
    return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin đăng ký.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Địa chỉ email không hợp lệ.' }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'Số điện thoại không hợp lệ.' }, { status: 400 });
  }
  if (
    isRateLimited(`otp-send-ip:${ip}`, MAX_SEND_REQUESTS) ||
    isRateLimited(`otp-send-email:${email}`, MAX_SEND_REQUESTS)
  ) {
    return NextResponse.json(
      { error: 'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 15 phút.' },
      { status: 429 },
    );
  }

  const otp = randomInt(100000, 1000000).toString();
  const challenge = createChallenge(email, username, phone, otp);
  await sendOtpEmail(email, username, otp);

  return NextResponse.json({
    success: true,
    challenge,
    expiresInSeconds: OTP_EXPIRES_MS / 1000,
  });
}

async function handleVerify(req: NextRequest, payload: Record<string, unknown>) {
  const challengeValue = cleanText(payload.challenge, 3000);
  const otp = cleanText(payload.otp, 6);
  const password = typeof payload.password === 'string' ? payload.password : '';
  const ip = getClientIp(req);

  if (isRateLimited(`otp-verify-ip:${ip}`, MAX_VERIFY_REQUESTS)) {
    return NextResponse.json(
      { error: 'Bạn đã nhập OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
      { status: 429 },
    );
  }
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: 'Mã OTP phải gồm đúng 6 chữ số.' }, { status: 400 });
  }
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json({ error: 'Mật khẩu phải có từ 8 đến 72 ký tự.' }, { status: 400 });
  }

  const challenge = readChallenge(challengeValue);
  if (!challenge) {
    return NextResponse.json({ error: 'Phiên xác thực OTP không hợp lệ.' }, { status: 400 });
  }
  if (challenge.expiresAt < Date.now()) {
    return NextResponse.json({ error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' }, { status: 410 });
  }

  const expectedOtpHash = createDigest(
    `${challenge.email}:${otp}:${challenge.salt}:${challenge.expiresAt}`,
    getChallengeSecret(),
  );
  if (!safeCompare(challenge.otpHash, expectedOtpHash)) {
    return NextResponse.json({ error: 'Mã OTP không chính xác.' }, { status: 400 });
  }

  const supabaseAdmin = createServiceRoleClient();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: challenge.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: challenge.username,
      username: challenge.username,
      phone: challenge.phone,
    },
  });

  if (error || !data.user) {
    const message = error?.message || '';
    if (/already|registered|exists/i.test(message)) {
      return NextResponse.json(
        { error: 'Email này đã được sử dụng. Vui lòng đăng nhập.' },
        { status: 409 },
      );
    }
    console.error('Không thể tạo tài khoản Supabase:', message);
    return NextResponse.json({ error: 'Không thể tạo tài khoản lúc này.' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: profileError } = await supabaseAdmin.from('users').upsert({
    id: data.user.id,
    uid: data.user.id,
    email: challenge.email,
    username: challenge.username,
    phone: challenge.phone,
    role: 'user',
    createdAt: now,
  });

  if (profileError) {
    console.error('Không thể tạo hồ sơ người dùng:', profileError.message);
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: 'Không thể hoàn tất hồ sơ tài khoản.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const blockedIps = await getBlockedIpsForRequest();
    if (isBlockedIp(ip, blockedIps)) {
      return NextResponse.json({ error: 'Địa chỉ IP đã bị chặn.' }, { status: 403 });
    }

    const payload = await req.json() as Record<string, unknown>;
    if (payload.action === 'send') return await handleSend(req, payload);
    if (payload.action === 'verify') return await handleVerify(req, payload);

    return NextResponse.json({ error: 'Yêu cầu OTP không hợp lệ.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('Lỗi xử lý đăng ký OTP:', message);
    return NextResponse.json(
      { error: 'Hệ thống xác thực email đang tạm thời gián đoạn.' },
      { status: 500 },
    );
  }
}
