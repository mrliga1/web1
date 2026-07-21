import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "../supabase";
import type { News, Product, Project } from "../types";
import { generateSlug } from "./utils";

type PublicContent = Product | News | Project;
type ContentTable = "products" | "news" | "projects";

interface ContentRow<T extends PublicContent> {
  id: string;
  data: T;
}

export type PublicSettingsData = Record<string, unknown>;

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

export const getPublicSettings = (id: "general" | "filters") =>
  getSettingsRow(id);
