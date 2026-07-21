import { permanentRedirect } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import { generateSlug } from "../../../src/lib/utils";
import {
  getPublicSettings,
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
} from "../../../src/lib/serverContent";

export const revalidate = 60;

export default async function CategoryNewsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const requestSlug = generateSlug(decodedName);

  if (name !== requestSlug) {
    permanentRedirect(`/category-news/${requestSlug}`);
  }

  let categoryName = decodedName;
  let canonicalSlug = requestSlug;

  const [generalSettings, newsRows, productRows, projectRows] = await Promise.all([
    getPublicSettings("general"),
    getPublishedNews(),
    getPublishedProducts(),
    getPublishedProjects(),
  ]);
  const categories = (generalSettings.newsCategoriesExt || []) as Array<{ name?: string }>;
  const category = categories.find((item) => {
    return (
      item.name === decodedName ||
      generateSlug(item.name || "") === generateSlug(decodedName)
    );
  });

  if (category?.name) {
    categoryName = category.name;
    canonicalSlug = generateSlug(category.name);
  }

  if (name !== canonicalSlug) {
    permanentRedirect(`/category-news/${canonicalSlug}`);
  }

  return (
    <ClientWrapper
      categoryName={categoryName}
      initialNews={newsRows.map(({ id, data }) => ({ ...data, id }))}
      initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
      initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
      initialGeneralSettings={generalSettings}
    />
  );
}
