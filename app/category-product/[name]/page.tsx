// Trang danh mục sản phẩm - nhận tên danh mục từ params và giải mã URI
import ClientWrapper from "./ClientWrapper";
import { permanentRedirect } from "next/navigation";
import { generateSlug } from '../../../src/lib/utils';
import type { CategoryExt } from '../../../src/types';
import SchemaMarkup from '../../../src/components/SchemaMarkup';
import { createCollectionPageSchemas } from '../../../src/lib/contentSchemas';
import {
  getPublicSettings,
  getPublicLayout,
  getPublishedProducts,
  getPublishedProjects,
} from '../../../src/lib/serverContent';

export const revalidate = 60;

export default async function CategoryProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ name }, query] = await Promise.all([params, searchParams]);
  const decodedName = decodeURIComponent(name);
  const requestSlug = generateSlug(decodedName);
  const initialCategoryLayout = query.view === 'split' ? 'split' : 'grid';

  if (name !== requestSlug) {
    permanentRedirect(`/category-product/${requestSlug}`);
  }
  
  let initialCategoryTitle;
  let initialCategoryDesc;
  let initialCategoryName;
  let canonicalSlug = requestSlug;
  let selectedCategory: CategoryExt | undefined;

  const [generalSettings, filterSettings, productRows, projectRows, initialSections] = await Promise.all([
    getPublicSettings('general'),
    getPublicSettings('filters'),
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicLayout('san-pham'),
  ]);

  try {
    if (generalSettings.productCategoriesExt) {
      const cats = generalSettings.productCategoriesExt as CategoryExt[];
      const cat = cats.find((c) => c.name === decodedName || generateSlug(c.name) === decodedName);
      if (cat) {
        selectedCategory = cat;
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

  const categories = (generalSettings.productCategoriesExt || []) as CategoryExt[];
  const childCategoryNames = selectedCategory
    ? categories
        .filter((item) => item.parentId === selectedCategory?.id || item.parentId === selectedCategory?.name)
        .map((item) => item.name)
    : [];
  const categoryTitle = initialCategoryTitle || initialCategoryName || decodedName.replace(/-/g, " ");
  const categoryDescription =
    initialCategoryDesc || `Khám phá các sản phẩm nổi bật thuộc danh mục ${categoryTitle}.`;
  const acceptedCategorySlugs = new Set(
    [initialCategoryName || decodedName, ...childCategoryNames].map((item) => generateSlug(item)),
  );
  const categoryProductRows = productRows.filter(({ data }) =>
    acceptedCategorySlugs.has(generateSlug(data.category || "")),
  );
  const { webPage, itemList, breadcrumb } = createCollectionPageSchemas({
    path: `/category-product/${canonicalSlug}`,
    name: categoryTitle,
    description: categoryDescription,
    topics: [initialCategoryName || decodedName, ...childCategoryNames],
    breadcrumbs: [
      { name: "Trang chủ", path: "/" },
      { name: "Bất động sản", path: "/san-pham" },
      { name: initialCategoryName || decodedName, path: `/category-product/${canonicalSlug}` },
    ],
    items: categoryProductRows.map(({ data }) => ({
      name: data.title,
      url: `/san-pham/${generateSlug(data.title)}`,
      image: data.imageUrl,
      description: data.description,
    })),
  });

  return (
    <>
      <SchemaMarkup schema={webPage} />
      <SchemaMarkup schema={itemList} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper
        categoryName={decodedName}
        initialCategoryTitle={initialCategoryTitle}
        initialCategoryDesc={initialCategoryDesc}
        initialCategoryName={initialCategoryName}
        initialCategoryLayout={initialCategoryLayout}
        initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
        initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
        initialSections={initialSections}
        initialGeneralSettings={generalSettings}
        initialFilterSettings={filterSettings}
      />
    </>
  );
}
