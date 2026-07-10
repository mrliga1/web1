import { NextResponse } from 'next/server';
import { db, collection, getDocs } from '../../../firebase';

export async function GET() {
  const prodSnap = await getDocs(collection(db, 'products'));
  const locations = new Set<string>();
  prodSnap.forEach(doc => {
    const data = doc.data();
    if (data.district) {
      locations.add(data.district.trim());
    }
  });
  return NextResponse.json({ locations: Array.from(locations) });
}
