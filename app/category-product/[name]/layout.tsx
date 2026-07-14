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
  
  let finalTitle = `Bất Động Sản ${decodedName.replace(/-/g, ' ')}`;
  let finalDesc = `Khám phá các sản phẩm nổi bật thuộc danh mục ${decodedName.replace(/-/g, ' ')}.`;

  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
    if (!error && data && data.data && data.data.productCategoriesExt) {
      const cats = data.data.productCategoriesExt;
      const cat = cats.find((c: any) => c.name === decodedName || generateSlug(c.name) === decodedName);
      if (cat) {
        finalTitle = cat.seoTitle || cat.name || finalTitle;
        finalDesc = cat.seoDesc || cat.description || finalDesc;
      }
    }
  } catch (e) {
    console.error("Lỗi khi load metadata danh mục:", e);
  }

  return {
    title: finalTitle.includes('Greenia Homes') ? finalTitle : `${finalTitle} - Greenia Homes`,
    description: finalDesc,
    openGraph: {
      title: finalTitle,
      description: finalDesc,
      type: "website",
      url: `https://greeniahomes.vn/category-product/${name}`,
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDesc,
    },
    alternates: {
      canonical: `https://greeniahomes.vn/category-product/${name}`,
    }
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
