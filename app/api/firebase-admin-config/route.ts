import { NextRequest, NextResponse } from 'next/server';

/* API này không còn cần thiết khi dùng Supabase.
   Giữ lại stub để tránh lỗi 404 nếu client gọi. */
export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Đã chuyển sang Supabase. API này không còn cần thiết.' 
  });
}
