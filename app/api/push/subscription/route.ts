import { NextRequest, NextResponse } from 'next/server';
import { verifyStaff } from '../../lib/auth';
import { createServiceRoleClient } from '../../../../src/lib/serverSupabase';
import { getWebPushPublicKey } from '../../../../src/lib/webPushServer';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authResult = await verifyStaff(request);
  if (!authResult.authorized || !authResult.profile) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const publicKey = getWebPushPublicKey();
  if (!publicKey) return NextResponse.json({ configured: false, subscribed: false });

  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_uid', authResult.profile.uid);
  if (error) return NextResponse.json({ error: 'Không thể kiểm tra subscription' }, { status: 502 });
  return NextResponse.json({ configured: true, subscribed: Boolean(count), publicKey });
}

export async function POST(request: NextRequest) {
  const authResult = await verifyStaff(request);
  if (!authResult.authorized || !authResult.profile) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys.auth || body.endpoint.length > 2048) {
    return NextResponse.json({ error: 'Subscription không hợp lệ' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_uid: authResult.profile.uid,
    user_email: authResult.profile.email,
    user_role: authResult.profile.role,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ error: 'Không thể lưu subscription' }, { status: 502 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const authResult = await verifyStaff(request);
  if (!authResult.authorized || !authResult.profile) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('push_subscriptions').delete().eq('user_uid', authResult.profile.uid);
  if (error) return NextResponse.json({ error: 'Không thể xóa subscription' }, { status: 502 });
  return NextResponse.json({ success: true });
}
