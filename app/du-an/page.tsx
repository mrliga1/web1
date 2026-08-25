import ClientWrapper from "./ClientWrapper";
import {
  getPublishedProducts,
  getPublishedProjects,
  getPublicLayout,
} from "../../src/lib/serverContent";
import SchemaMarkup from "../../src/components/SchemaMarkup";
import { createCollectionPageSchemas } from "../../src/lib/contentSchemas";
import { generateSlug } from "../../src/lib/utils";

export const revalidate = 60;

export default async function DuAnPage() {
  const [projectRows, productRows, initialSections] = await Promise.all([
    getPublishedProjects(),
    getPublishedProducts(),
    getPublicLayout("du-an"),
  ]);
  const projects = projectRows.map(({ id, data }) => ({ ...data, id }));
  const { webPage, itemList, breadcrumb } = createCollectionPageSchemas({
    path: "/du-an",
    name: "Dự án bất động sản",
    description: "Các dự án bất động sản nổi bật tại TP.HCM. Thông tin chi tiết, tiến độ, giá bán từ Greenia Homes.",
    topics: ["Dự án bất động sản", "Tiến độ dự án", "Giá bán dự án"],
    breadcrumbs: [
      { name: "Trang chủ", path: "/" },
      { name: "Dự án", path: "/du-an" },
    ],
    items: projects.map((project) => ({
      name: project.title,
      url: `/du-an/${generateSlug(project.title)}`,
      image: project.imageUrl,
      description: project.description,
    })),
  });

  return (
    <>
      <SchemaMarkup schema={webPage} />
      <SchemaMarkup schema={itemList} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper
        initialProjects={projects}
        initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
        initialSections={initialSections}
      />
    </>
  );
}
