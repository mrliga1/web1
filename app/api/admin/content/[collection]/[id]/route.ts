import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticated } from '../../../../lib/auth';
import { createServiceRoleClient } from '../../../../../../src/lib/serverSupabase';

const ALLOWED_COLLECTIONS = new Set(['products', 'projects', 'news', 'consultations']);

type ContentRecord = {
  id: string;
  data?: {
    createdBy?: string;
  } | null;
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  const authResult = await verifyAuthenticated(request);
  if (!authResult.authorized || !authResult.profile) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { collection, id } = await params;
  if (!ALLOWED_COLLECTIONS.has(collection) || !id || id.length > 200) {
    return NextResponse.json({ error: 'Dữ liệu cần xóa không hợp lệ' }, { status: 400 });
  }

  const { role, email } = authResult.profile;
  if (role === 'editor') {
    return NextResponse.json({ error: 'Biên tập viên không có quyền xóa dữ liệu' }, { status: 403 });
  }
  if (collection === 'consultations' && role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ quản trị viên được xóa khách hàng' }, { status: 403 });
  }

  try {
    const supabase = createServiceRoleClient();
    const lookup = await supabase
      .from(collection)
      .select('id, data')
      .eq('id', id)
      .maybeSingle();

    if (lookup.error) throw lookup.error;
    const record = lookup.data as ContentRecord | null;
    if (!record) {
      return NextResponse.json({ success: true, alreadyDeleted: true });
    }

    if (role !== 'admin') {
      const ownerEmail = String(record.data?.createdBy || '').trim().toLowerCase();
      if (!ownerEmail || ownerEmail !== email.toLowerCase()) {
        return NextResponse.json({ error: 'Bạn chỉ được xóa nội dung do mình đăng' }, { status: 403 });
      }
    }

    const deletion = await supabase.from(collection).delete().eq('id', id).select('id');
    if (deletion.error) throw deletion.error;
    if (!deletion.data?.length) {
      return NextResponse.json({ error: 'Cơ sở dữ liệu không xác nhận bản ghi đã được xóa' }, { status: 409 });
    }

    return NextResponse.json({ success: true, deletedId: id, collection });
  } catch (error) {
    console.error(`Không thể xóa ${collection}/${id}:`, error);
    return NextResponse.json({ error: 'Không thể xóa dữ liệu trên máy chủ' }, { status: 500 });
  }
}
