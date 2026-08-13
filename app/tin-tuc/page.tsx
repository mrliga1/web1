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

export const revalidate = 60;

export default async function TinTucPage() {
  const [newsRows, productRows, projectRows, generalSettings, initialSections] = await Promise.all([
    getPublishedNews(),
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
    getPublicLayout("tin-tuc"),
  ]);

  return (
    <ClientWrapper
      initialNews={newsRows.map(({ id, data }) => toNewsListItem(id, data))}
      initialProducts={productRows.map(({ id, data }) => toProductListItem(id, data))}
      initialProjects={projectRows.map(({ id, data }) => toProjectListItem(id, data))}
      initialGeneralSettings={{ newsCategoriesExt: generalSettings.newsCategoriesExt }}
      initialSections={initialSections}
    />
  );
}
