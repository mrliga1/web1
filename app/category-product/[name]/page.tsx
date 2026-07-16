// Trang danh mục sản phẩm - nhận tên danh mục từ params và giải mã URI
import ClientWrapper from "./ClientWrapper";
import { permanentRedirect } from "next/navigation";
import { generateSlug } from '../../../src/lib/utils';
import { supabase } from '../../../src/supabase';

export const dynamic = 'force-dynamic';

export default async function CategoryProductPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const requestSlug = generateSlug(decodedName);

  if (name !== requestSlug) {
    permanentRedirect(`/category-product/${requestSlug}`);
  }
  
  let initialCategoryTitle;
  let initialCategoryDesc;
  let initialCategoryName;
  let canonicalSlug = requestSlug;

  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
    if (!error && data && data.data && data.data.productCategoriesExt) {
      const cats = data.data.productCategoriesExt;
      const cat = cats.find((c: any) => c.name === decodedName || generateSlug(c.name) === decodedName);
      if (cat) {
        initialCategoryTitle = cat.seoTitle || cat.name;
        initialCategoryDesc = cat.seoDesc || cat.description || `Khám phá các sản phẩm nổi bật thuộc danh mục ${cat.name}.`;
        initialCategoryName = cat.name;
        canonicalSlug = generateSlug(cat.name);
      }
    }
  } catch (e) {
    console.error("Error fetching seo data for category", e);
  }

  if (name !== canonicalSlug) {
    permanentRedirect(`/category-product/${canonicalSlug}`);
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
