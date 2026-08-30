import ClientWrapper from "./ClientWrapper";
import {
  getPublicSettings,
  getPublicLayout,
  getPublishedProducts,
  getPublishedProjects,
} from "../../src/lib/serverContent";
import SchemaMarkup from "../../src/components/SchemaMarkup";
import { createCollectionPageSchemas } from "../../src/lib/contentSchemas";
import { generateSlug } from "../../src/lib/utils";
import { getManagedLocationMetadata, getManagedStaticMetadata } from "../../src/lib/staticSeo";

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const location = typeof params.location === 'string' ? params.location : '';
  return location
    ? getManagedLocationMetadata(location)
    : getManagedStaticMetadata('/san-pham');
}

export default async function SanPhamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, productRows, projectRows, generalSettings, filterSettings, initialSections] = await Promise.all([
    searchParams,
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
    getPublicSettings("filters"),
    getPublicLayout("san-pham"),
  ]);
  const getParam = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const products = productRows.map(({ id, data }) => ({ ...data, id }));
  const { webPage, itemList, breadcrumb } = createCollectionPageSchemas({
    path: "/san-pham",
    name: "Bất động sản",
    description: "Danh sách sản phẩm bất động sản tại Greenia Homes. Tìm kiếm căn hộ, nhà phố, biệt thự phù hợp nhu cầu.",
    topics: ["Bất động sản chuyển nhượng", "Bất động sản cho thuê", "Bất động sản TP.HCM"],
    breadcrumbs: [
      { name: "Trang chủ", path: "/" },
      { name: "Bất động sản", path: "/san-pham" },
    ],
    items: products.map((product) => ({
      name: product.title,
      url: `/san-pham/${generateSlug(product.title)}`,
      image: product.imageUrl,
      description: product.description,
    })),
  });

  return (
    <>
      <SchemaMarkup schema={webPage} />
      <SchemaMarkup schema={itemList} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper
        initialProducts={products}
        initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
        initialGeneralSettings={generalSettings}
        initialFilterSettings={filterSettings}
        initialSections={initialSections}
        initialPriceRange={getParam("priceRange")}
        initialAreaRange={getParam("areaRange")}
        initialLocation={getParam("location")}
      />
    </>
  );
}
