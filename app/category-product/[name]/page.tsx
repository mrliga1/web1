// Trang danh mục sản phẩm - nhận tên danh mục từ params và giải mã URI
import ClientWrapper from "./ClientWrapper";
import { createClient } from '@supabase/supabase-js';
import { generateSlug } from '../../../src/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback'
);

export default async function CategoryProductPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  
  let initialCategoryTitle;
  let initialCategoryDesc;
  let initialCategoryName;

  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
    if (!error && data && data.data && data.data.productCategoriesExt) {
      const cats = data.data.productCategoriesExt;
      const cat = cats.find((c: any) => c.name === decodedName || generateSlug(c.name) === decodedName);
      if (cat) {
        initialCategoryTitle = cat.seoTitle || cat.name;
        initialCategoryDesc = cat.seoDesc || cat.description || `Khám phá các sản phẩm nổi bật thuộc danh mục ${cat.name}.`;
        initialCategoryName = cat.name;
      }
    }
  } catch (e) {
    console.error("Error fetching seo data for category", e);
  }

  return (
    <ClientWrapper 
      categoryName={decodedName} 
      initialCategoryTitle={initialCategoryTitle}
      initialCategoryDesc={initialCategoryDesc}
      initialCategoryName={initialCategoryName}
    />
  );
}
