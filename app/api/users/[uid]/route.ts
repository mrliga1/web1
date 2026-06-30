import { NextRequest, NextResponse } from 'next/server';
import { admin } from '../../lib/firebase-admin';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params;
    if (!admin.apps || admin.apps.length === 0) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }
    await admin.auth().deleteUser(uid);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
