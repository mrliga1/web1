import ClientWrapper from "./ClientWrapper";
import {
  getPublicSettings,
  getPublicLayout,
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
  toNewsListItem,
  toProductListItem,
  toProjectListItem,
} from "../../src/lib/serverContent";
import SchemaMarkup from "../../src/components/SchemaMarkup";
import { createCollectionPageSchemas } from "../../src/lib/contentSchemas";
import { generateSlug } from "../../src/lib/utils";

export const revalidate = 60;

export default async function TinTucPage() {
  const [newsRows, productRows, projectRows, generalSettings, initialSections] = await Promise.all([
    getPublishedNews(),
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
    getPublicLayout("tin-tuc"),
  ]);
  const news = newsRows.map(({ id, data }) => toNewsListItem(id, data));
  const { webPage, itemList, breadcrumb } = createCollectionPageSchemas({
    path: "/tin-tuc",
    name: "Tin tức bất động sản",
    description: "Tin tức bất động sản mới nhất. Phân tích thị trường, xu hướng đầu tư, kiến thức mua bán nhà đất.",
    topics: ["Thị trường bất động sản", "Kiến thức mua bán nhà đất", "Thông tin dự án"],
    breadcrumbs: [
      { name: "Trang chủ", path: "/" },
      { name: "Tin tức", path: "/tin-tuc" },
    ],
    items: news.map((article) => ({
      name: article.title,
      url: `/tin-tuc/${generateSlug(article.title)}`,
      image: article.imageUrl,
      description: article.description,
    })),
  });

  return (
    <>
      <SchemaMarkup schema={webPage} />
      <SchemaMarkup schema={itemList} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper
        initialNews={news}
        initialProducts={productRows.map(({ id, data }) => toProductListItem(id, data))}
        initialProjects={projectRows.map(({ id, data }) => toProjectListItem(id, data))}
        initialGeneralSettings={{ newsCategoriesExt: generalSettings.newsCategoriesExt }}
        initialSections={initialSections}
      />
    </>
  );
}
