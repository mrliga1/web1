import type { Metadata } from 'next';

type Props = {
  params: Promise<{ name: string }>;
};

import { createClient } from '@supabase/supabase-js';
import { generateSlug } from '../../../src/lib/utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback'
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  
  let finalTitle = `Tin Tức ${decodedName.replace(/-/g, ' ')}`;
  let finalDesc = `Cập nhật tin tức mới nhất về ${decodedName.replace(/-/g, ' ')}.`;

  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
    if (!error && data && data.data && data.data.newsCategoriesExt) {
      const cats = data.data.newsCategoriesExt;
      const cat = cats.find((c: any) => c.name === decodedName || generateSlug(c.name) === decodedName);
      if (cat) {
        finalTitle = cat.seoTitle || cat.name || finalTitle;
        finalDesc = cat.seoDescription || cat.description || finalDesc;
      }
    }
  } catch (e) {
    console.error("Lỗi khi load metadata danh mục tin tức:", e);
  }

  return {
    title: finalTitle.includes('Greenia Homes') ? finalTitle : `${finalTitle} - Greenia Homes`,
    description: finalDesc
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
