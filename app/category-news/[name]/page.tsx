import { permanentRedirect } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import { generateSlug } from "../../../src/lib/utils";
import {
  getPublicSettings,
  getPublicLayout,
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
  toNewsListItem,
  toProductListItem,
  toProjectListItem,
} from "../../../src/lib/serverContent";

export const revalidate = 60;

export async function generateStaticParams() {
  const [generalSettings, newsRows] = await Promise.all([
    getPublicSettings("general"),
    getPublishedNews(),
  ]);
  const configuredCategories = (generalSettings.newsCategoriesExt || []) as Array<{ name?: string }>;
  const categoryNames = new Set<string>();

  configuredCategories.forEach((category) => {
    if (category.name?.trim()) categoryNames.add(category.name.trim());
  });
  newsRows.forEach(({ data }) => {
    if (data.category?.trim()) categoryNames.add(data.category.trim());
  });

  return Array.from(categoryNames).map((categoryName) => ({
    name: generateSlug(categoryName),
  }));
}

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

  const [generalSettings, newsRows, productRows, projectRows, initialSections] = await Promise.all([
    getPublicSettings("general"),
    getPublishedNews(),
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicLayout("tin-tuc"),
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
      initialNews={newsRows.map(({ id, data }) => toNewsListItem(id, data))}
      initialProducts={productRows.map(({ id, data }) => toProductListItem(id, data))}
      initialProjects={projectRows.map(({ id, data }) => toProjectListItem(id, data))}
      initialGeneralSettings={{ newsCategoriesExt: generalSettings.newsCategoriesExt }}
      initialSections={initialSections}
    />
  );
}
