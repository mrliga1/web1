import { NextResponse } from 'next/server';
import { admin } from '../lib/firebase-admin';

export async function GET() {
  const isConfigured = admin.apps && admin.apps.length > 0;
  return NextResponse.json({ configured: isConfigured });
}
