import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '../../lib/auth';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* API xóa người dùng qua Supabase Admin. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const authResult = await verifyAdmin(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { uid } = await params;
    if (!UUID_PATTERN.test(uid)) {
      return NextResponse.json({ error: 'Mã người dùng không hợp lệ' }, { status: 400 });
    }
    if (authResult.profile?.uid === uid) {
      return NextResponse.json({ error: 'Không thể tự xóa tài khoản đang đăng nhập' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Supabase service role chưa được cấu hình' }, { status: 503 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Ưu tiên tìm hồ sơ theo uid Auth, sau đó mới dự phòng theo khóa id của bảng.
    const profileLookup = await supabaseAdmin
      .from('users')
      .select('id, uid')
      .eq('uid', uid)
      .maybeSingle();

    if (profileLookup.error) throw profileLookup.error;
    let profile = profileLookup.data;
    if (!profile) {
      const fallback = await supabaseAdmin
        .from('users')
        .select('id, uid')
        .eq('id', uid)
        .maybeSingle();
      if (fallback.error) throw fallback.error;
      profile = fallback.data;
    }

    const authUid = String(profile?.uid || uid);
    if (authResult.profile?.uid === authUid) {
      return NextResponse.json({ error: 'Không thể tự xóa tài khoản đang đăng nhập' }, { status: 400 });
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUid);
    if (authDeleteError && !/not found|no user/i.test(authDeleteError.message)) {
      throw authDeleteError;
    }

    // Xóa hồ sơ bằng service-role để không phụ thuộc RLS ở trình duyệt.
    const profileIds = Array.from(new Set([uid, profile?.id].filter(Boolean))) as string[];
    if (profileIds.length > 0) {
      const { error: idDeleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .in('id', profileIds);
      if (idDeleteError) throw idDeleteError;
    }

    const { error: uidDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('uid', authUid);
    if (uidDeleteError) throw uidDeleteError;

    return NextResponse.json({
      success: true,
      deletedUid: authUid,
      profileDeleted: Boolean(profile),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xóa người dùng';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
