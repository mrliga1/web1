import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "../supabase";
import type { GeneralSettingsData, News, Product, Project, VisualSection } from "../types";
import { generateSlug } from "./utils";
import { deserializeSectionsFromDatabase } from "./layoutUtils";
import { getPageDefaultSections } from "./layouts";

type PublicContent = Product | News | Project;
type ContentTable = "products" | "news" | "projects";
type PublicLayoutId = "san-pham" | "du-an" | "tin-tuc" | "lien-he";

interface ContentRow<T extends PublicContent> {
  id: string;
  data: T;
}

export type PublicSettingsData = GeneralSettingsData;

const getContentRows = unstable_cache(
  async (table: ContentTable): Promise<ContentRow<PublicContent>[]> => {
    const { data, error } = await supabase.from(table).select("id,data");

    if (error) {
    console.error(`Không thể tải dữ liệu công khai từ bảng ${table}:`, error);
      return [];
    }

    return (data || []).filter((row): row is ContentRow<PublicContent> => {
      return Boolean(row?.id && row?.data);
    });
  },
  ["public-content-rows-v1"],
  {
    revalidate: 60,
    tags: ["public-content"],
  },
);

const getSettingsRow = unstable_cache(
  async (id: string): Promise<PublicSettingsData> => {
    const { data, error } = await supabase
      .from("settings")
      .select("data")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`Không thể tải cấu hình công khai ${id}:`, error);
      return {};
    }

    return (data?.data || {}) as PublicSettingsData;
  },
  ["public-settings-row-v1"],
  {
    revalidate: 60,
    tags: ["public-settings"],
  },
);

const getLayoutSections = unstable_cache(
  async (id: PublicLayoutId): Promise<VisualSection[]> => {
    const fallback = getPageDefaultSections(id);
    const { data, error } = await supabase
      .from("layouts")
      .select("data")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`Không thể tải bố cục công khai ${id}:`, error);
      return fallback;
    }

    const payload = data?.data as { sections?: unknown } | null | undefined;
    const sections = Array.isArray(payload?.sections)
      ? deserializeSectionsFromDatabase<VisualSection>(payload.sections as VisualSection[])
      : [];
    return sections.length > 0 ? sections : fallback;
  },
  ["public-layout-sections-v1"],
  {
    revalidate: 60,
    tags: ["public-layouts"],
  },
);

export function isPublishedContent(item: Pick<PublicContent, "approvalStatus">) {
  return !item.approvalStatus || item.approvalStatus === "approved";
}

async function getPublishedBySlug<T extends PublicContent>(
  table: ContentTable,
  slug: string,
) {
  const rows = (await getContentRows(table)) as ContentRow<T>[];
  const matchedRow = rows.find((row) => {
    return (
      isPublishedContent(row.data) &&
      generateSlug(row.data.title || "") === slug
    );
  });

  return matchedRow ? ({ ...matchedRow.data, id: matchedRow.id } as T) : null;
}

async function getPublishedRows<T extends PublicContent>(table: ContentTable) {
  const rows = (await getContentRows(table)) as ContentRow<T>[];
  return rows.filter((row) => isPublishedContent(row.data));
}

export const getProductBySlug = (slug: string) =>
  getPublishedBySlug<Product>("products", slug);

export const getNewsBySlug = (slug: string) =>
  getPublishedBySlug<News>("news", slug);

export const getProjectBySlug = (slug: string) =>
  getPublishedBySlug<Project>("projects", slug);

export const getPublishedProducts = () =>
  getPublishedRows<Product>("products");

export const getPublishedNews = () => getPublishedRows<News>("news");

export const getPublishedProjects = () =>
  getPublishedRows<Project>("projects");

export function toNewsListItem(id: string, data: News): News {
  return {
    id,
    title: data.title || "",
    description: data.description || "",
    content: "",
    category: data.category || "",
    imageUrl: data.imageUrl || "",
    thumbnail: data.thumbnail,
    viewsCount: data.viewsCount || 0,
    author: data.author || "",
    createdAt: data.createdAt || "",
    approvalStatus: data.approvalStatus,
  };
}

export function toProductListItem(id: string, data: Product): Product {
  return {
    id,
    title: data.title || "",
    priceText: data.priceText || data.price || "",
    priceVal: data.priceVal || 0,
    type: data.type || "sale",
    district: data.district || data.location || "",
    street: data.street,
    phone: data.phone || "",
    imageUrl: data.imageUrl || data.imageUrls?.[0] || "",
    imageUrls: data.imageUrls?.[0] ? [data.imageUrls[0]] : undefined,
    area: data.area,
    bedrooms: data.bedrooms,
    toilets: data.toilets,
    category: data.category || "",
    location: data.location,
    viewsCount: data.viewsCount || 0,
    createdAt: data.createdAt || "",
    createdBy: data.createdBy || "",
    createdByRole: data.createdByRole || "member",
    approvalStatus: data.approvalStatus || "approved",
  };
}

export function toProjectListItem(id: string, data: Project): Project {
  return {
    id,
    title: data.title || "",
    priceText: data.priceText || "",
    priceVal: data.priceVal || 0,
    location: data.location || "",
    units: data.units,
    imageUrl: data.imageUrl || data.imageUrls?.[0] || data.images?.[0] || "",
    status: data.status || "opening",
    description: "",
    scale: data.scale,
    viewsCount: data.viewsCount || 0,
    createdAt: data.createdAt || "",
    approvalStatus: data.approvalStatus,
  };
}

export const getPublicSettings = (id: "general" | "filters") =>
  getSettingsRow(id);

export const getPublicLayout = (id: PublicLayoutId) => getLayoutSections(id);
