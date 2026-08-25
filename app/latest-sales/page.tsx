import ClientWrapper from "../san-pham/ClientWrapper";
import {
  getPublicSettings,
  getPublicLayout,
  getPublishedProducts,
  getPublishedProjects,
} from "../../src/lib/serverContent";
import SchemaMarkup from "../../src/components/SchemaMarkup";
import { createCollectionPageSchemas } from "../../src/lib/contentSchemas";
import { generateSlug } from "../../src/lib/utils";

export const revalidate = 60;

export default async function LatestSalesPage() {
  const [productRows, projectRows, generalSettings, filterSettings, initialSections] = await Promise.all([
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
    getPublicSettings("filters"),
    getPublicLayout("san-pham"),
  ]);
  const products = productRows.map(({ id, data }) => ({ ...data, id }));
  const saleProducts = products.filter((product) => product.type !== "rent");
  const { webPage, itemList, breadcrumb } = createCollectionPageSchemas({
    path: "/latest-sales",
    name: "Bất động sản chuyển nhượng mới nhất",
    description: "Danh sách bất động sản chuyển nhượng mới nhất. Tìm kiếm căn hộ, nhà phố, biệt thự giá tốt tại Greenia Homes.",
    topics: ["Bất động sản chuyển nhượng", "Nhà đất bán mới nhất"],
    breadcrumbs: [
      { name: "Trang chủ", path: "/" },
      { name: "Bất động sản chuyển nhượng mới nhất", path: "/latest-sales" },
    ],
    items: saleProducts.map((product) => ({
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
        initialType="sale"
      />
    </>
  );
}
