import type { MetadataRoute } from "next";
import {
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
} from "../src/lib/serverContent";
import { generateSlug } from "../src/lib/utils";
import { supabase } from "../src/supabase";

const BASE_URL = "https://greeniahomes.vn";

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
    url: `${BASE_URL}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: "weekly",
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/san-pham`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/du-an`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/tin-tuc`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/lien-he`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/latest-sales`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/latest-rents`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/chinh-sach-bao-mat`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/dieu-khoan-su-dung`, changeFrequency: "yearly", priority: 0.3 },
  ];

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
        url: `${BASE_URL}/category-product/${generateSlug(category.name)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });

    newsCategories.forEach((category: { name?: string }) => {
      if (!category.name?.trim()) return;
      categoryRoutes.push({
        url: `${BASE_URL}/category-news/${generateSlug(category.name)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });
  }

  return [
    ...staticRoutes,
    ...productRoutes,
    ...newsRoutes,
    ...projectRoutes,
    ...categoryRoutes,
  ];
}
