// Trang danh mục sản phẩm - nhận tên danh mục từ params và giải mã URI
import ClientWrapper from "./ClientWrapper";
import { permanentRedirect } from "next/navigation";
import { generateSlug } from '../../../src/lib/utils';
import {
  getPublicSettings,
  getPublishedProducts,
  getPublishedProjects,
} from '../../../src/lib/serverContent';

export const revalidate = 60;

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

  const [generalSettings, filterSettings, productRows, projectRows] = await Promise.all([
    getPublicSettings('general'),
    getPublicSettings('filters'),
    getPublishedProducts(),
    getPublishedProjects(),
  ]);

  try {
    if (generalSettings.productCategoriesExt) {
      const cats = generalSettings.productCategoriesExt as any[];
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
      initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
      initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
      initialGeneralSettings={generalSettings}
      initialFilterSettings={filterSettings}
    />
  );
}
