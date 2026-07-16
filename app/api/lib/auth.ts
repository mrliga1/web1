import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export async function verifyAdmin(req: NextRequest) {
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
      .select('role')
      .eq('uid', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return { authorized: false, error: 'Chỉ quản trị viên được phép thực hiện thao tác này' };
    }

    return { authorized: true, user };
  } catch {
    return { authorized: false, error: 'Không thể xác thực quản trị viên' };
  }
}
