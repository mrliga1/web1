import { NextResponse } from 'next/server';

/* API kiểm tra trạng thái Supabase (thay thế firebase-admin-status) */
export async function GET() {
  const isConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return NextResponse.json({ configured: isConfigured });
}
