import type { MetadataRoute } from "next";
import {
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
} from "../src/lib/serverContent";
import { createCoreSitemapRoutes, SITE_URL } from "../src/lib/internalLinks";
import { generateSlug } from "../src/lib/utils";
import { supabase } from "../src/supabase";

function getLastModified(item: { createdAt?: string; updatedAt?: string }) {
  const source = item.updatedAt || item.createdAt;
  if (!source) return undefined;

  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function createContentRoute(
  path: string,
  item: { createdAt?: string; updatedAt?: string },
  priority: number,
): MetadataRoute.Sitemap[number] {
  const lastModified = getLastModified(item);

  return {
    url: `${SITE_URL}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: "weekly",
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = createCoreSitemapRoutes();

  const [products, news, projects] = await Promise.all([
    getPublishedProducts(),
    getPublishedNews(),
    getPublishedProjects(),
  ]);

  const productRoutes = products.map(({ data }) =>
    createContentRoute(
      `/san-pham/${generateSlug(data.title)}`,
      data as typeof data & { updatedAt?: string },
      0.8,
    ),
  );

  const newsRoutes = news.map(({ data }) =>
    createContentRoute(
      `/tin-tuc/${generateSlug(data.title)}`,
      data as typeof data & { updatedAt?: string },
      0.7,
    ),
  );

  const projectRoutes = projects.map(({ data }) =>
    createContentRoute(
      `/du-an/${generateSlug(data.title)}`,
      data as typeof data & { updatedAt?: string },
      0.7,
    ),
  );

  const categoryRoutes: MetadataRoute.Sitemap = [];
  const { data: settings, error } = await supabase
    .from("settings")
    .select("data")
    .eq("id", "general")
    .maybeSingle();

  if (error) {
    console.error("Không thể tải danh mục để tạo sitemap:", error);
  } else {
    const productCategories = settings?.data?.productCategoriesExt || [];
    const newsCategories = settings?.data?.newsCategoriesExt || [];

    productCategories.forEach((category: { name?: string }) => {
      if (!category.name?.trim()) return;
      categoryRoutes.push({
        url: `${SITE_URL}/category-product/${generateSlug(category.name)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });

    newsCategories.forEach((category: { name?: string }) => {
      if (!category.name?.trim()) return;
      categoryRoutes.push({
        url: `${SITE_URL}/category-news/${generateSlug(category.name)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });
  }

  const allRoutes = [
    ...staticRoutes,
    ...productRoutes,
    ...newsRoutes,
    ...projectRoutes,
    ...categoryRoutes,
  ];

  const seenUrls = new Set<string>();
  return allRoutes.filter((route) => {
    if (seenUrls.has(route.url)) return false;
    seenUrls.add(route.url);
    return true;
  });
}
