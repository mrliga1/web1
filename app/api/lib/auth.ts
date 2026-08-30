import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export type AuthenticatedProfile = {
  uid: string;
  email: string;
  role: string;
};

export async function verifyAuthenticated(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Thiếu hoặc sai thông tin xác thực' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { authorized: false, error: 'Máy chủ chưa được cấu hình Supabase' };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return { authorized: false, error: 'Thiếu mã xác thực' };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { authorized: false, error: 'Mã xác thực không hợp lệ' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('uid, email, role')
      .eq('uid', user.id)
      .single();

    if (profileError || !profile) {
      return { authorized: false, error: 'Không tìm thấy hồ sơ người dùng' };
    }

    return {
      authorized: true,
      user,
      profile: {
        uid: String(profile.uid || user.id),
        email: String(profile.email || user.email || '').toLowerCase(),
        role: String(profile.role || 'user'),
      } satisfies AuthenticatedProfile,
    };
  } catch {
    return { authorized: false, error: 'Không thể xác thực người dùng' };
  }
}

export async function verifyAdmin(req: NextRequest) {
  const authResult = await verifyAuthenticated(req);
  if (!authResult.authorized || !authResult.profile) return authResult;
  if (authResult.profile.role !== 'admin') {
    return { authorized: false, error: 'Chỉ quản trị viên được phép thực hiện thao tác này' };
  }
  return authResult;
}

export async function verifyStaff(req: NextRequest) {
  const authResult = await verifyAuthenticated(req);
  if (!authResult.authorized || !authResult.profile) return authResult;
  if (!['admin', 'editor', 'member'].includes(authResult.profile.role)) {
    return { authorized: false, error: 'Tài khoản không có quyền sử dụng thông báo quản trị' };
  }
  return authResult;
}
