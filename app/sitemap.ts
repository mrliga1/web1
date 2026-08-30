import type { MetadataRoute } from "next";
import {
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
} from "../src/lib/serverContent";
import { createCoreSitemapRoutes, SITE_URL } from "../src/lib/internalLinks";
import { generateSlug } from "../src/lib/utils";
import { supabase } from "../src/supabase";
import {
  DEFAULT_SITEMAP_SETTINGS,
  type SitemapSettingsData,
} from "../src/types";

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
  settings: SitemapSettingsData,
): MetadataRoute.Sitemap[number] {
  const lastModified = getLastModified(item);

  return {
    url: `${SITE_URL}${path}`,
    ...(settings.includeLastModified && lastModified ? { lastModified } : {}),
    changeFrequency: settings.changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: settingsDocument, error: settingsError } = await supabase
    .from("settings")
    .select("data")
    .eq("id", "general")
    .maybeSingle();
  if (settingsError) {
    console.error("Không thể tải cài đặt sitemap:", settingsError);
  }

  const rawSitemapSettings = settingsDocument?.data?.sitemapSettings;
  const sitemapSettings: SitemapSettingsData = {
    ...DEFAULT_SITEMAP_SETTINGS,
    ...(rawSitemapSettings && typeof rawSitemapSettings === "object"
      ? rawSitemapSettings as Partial<SitemapSettingsData>
      : {}),
  };
  if (!sitemapSettings.enabled) return [];

  const staticRoutes: MetadataRoute.Sitemap = createCoreSitemapRoutes();

  const [products, news, projects] = await Promise.all([
    getPublishedProducts(),
    getPublishedNews(),
    getPublishedProjects(),
  ]);

  const productRoutes = sitemapSettings.includeProducts ? products.map(({ data }) =>
    createContentRoute(
      `/san-pham/${generateSlug(data.title)}`,
      data as typeof data & { updatedAt?: string },
      sitemapSettings.productPriority,
      sitemapSettings,
    ),
  ) : [];

  const newsRoutes = sitemapSettings.includeNews ? news.map(({ data }) =>
    createContentRoute(
      `/tin-tuc/${generateSlug(data.title)}`,
      data as typeof data & { updatedAt?: string },
      sitemapSettings.newsPriority,
      sitemapSettings,
    ),
  ) : [];

  const projectRoutes = sitemapSettings.includeProjects ? projects.map(({ data }) =>
    createContentRoute(
      `/du-an/${generateSlug(data.title)}`,
      data as typeof data & { updatedAt?: string },
      sitemapSettings.projectPriority,
      sitemapSettings,
    ),
  ) : [];

  const categoryRoutes: MetadataRoute.Sitemap = [];
  if (sitemapSettings.includeCategories && !settingsError) {
    const productCategories = settingsDocument?.data?.productCategoriesExt || [];
    const newsCategories = settingsDocument?.data?.newsCategoriesExt || [];

    productCategories.forEach((category: { name?: string }) => {
      if (!category.name?.trim()) return;
      categoryRoutes.push({
        url: `${SITE_URL}/category-product/${generateSlug(category.name)}`,
        changeFrequency: sitemapSettings.changeFrequency,
        priority: sitemapSettings.categoryPriority,
      });
    });

    newsCategories.forEach((category: { name?: string }) => {
      if (!category.name?.trim()) return;
      categoryRoutes.push({
        url: `${SITE_URL}/category-news/${generateSlug(category.name)}`,
        changeFrequency: sitemapSettings.changeFrequency,
        priority: sitemapSettings.categoryPriority,
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
