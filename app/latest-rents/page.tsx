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

export default async function LatestRentsPage() {
  const [productRows, projectRows, generalSettings, filterSettings, initialSections] = await Promise.all([
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
    getPublicSettings("filters"),
    getPublicLayout("san-pham"),
  ]);
  const products = productRows.map(({ id, data }) => ({ ...data, id }));
  const rentProducts = products.filter((product) => product.type === "rent");
  const { webPage, itemList, breadcrumb } = createCollectionPageSchemas({
    path: "/latest-rents",
    name: "Bất động sản cho thuê mới nhất",
    description: "Khám phá danh sách bất động sản cho thuê mới nhất tại Greenia Homes. Cập nhật liên tục các căn hộ, nhà phố cho thuê giá tốt.",
    topics: ["Bất động sản cho thuê", "Nhà đất cho thuê mới nhất"],
    breadcrumbs: [
      { name: "Trang chủ", path: "/" },
      { name: "Bất động sản cho thuê mới nhất", path: "/latest-rents" },
    ],
    items: rentProducts.map((product) => ({
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
        initialType="rent"
      />
    </>
  );
}
