import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return { authorized: false, error: 'Invalid token' };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('uid', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return { authorized: false, error: 'Unauthorized: Admin access required' };
    }

    return { authorized: true, user };
  } catch (err) {
    return { authorized: false, error: 'Server error during authentication' };
  }
}
