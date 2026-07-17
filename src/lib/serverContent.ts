import "server-only";

import { cache } from "react";
import { supabase } from "../supabase";
import type { News, Product, Project } from "../types";
import { generateSlug } from "./utils";

type PublicContent = Product | News | Project;
type ContentTable = "products" | "news" | "projects";

interface ContentRow<T extends PublicContent> {
  id: string;
  data: T;
}

const getContentRows = cache(async <T extends PublicContent>(table: ContentTable) => {
  const { data, error } = await supabase.from(table).select("id,data");

  if (error) {
    console.error(`Không thể tải dữ liệu công khai từ bảng ${table}:`, error);
    return [] as ContentRow<T>[];
  }

  return (data || []).filter((row): row is ContentRow<T> => {
    return Boolean(row?.id && row?.data);
  });
});

export function isPublishedContent(item: Pick<PublicContent, "approvalStatus">) {
  return !item.approvalStatus || item.approvalStatus === "approved";
}

async function getPublishedBySlug<T extends PublicContent>(
  table: ContentTable,
  slug: string,
) {
  const rows = await getContentRows<T>(table);
  const matchedRow = rows.find((row) => {
    return (
      isPublishedContent(row.data) &&
      generateSlug(row.data.title || "") === slug
    );
  });

  return matchedRow ? ({ ...matchedRow.data, id: matchedRow.id } as T) : null;
}

async function getPublishedRows<T extends PublicContent>(table: ContentTable) {
  const rows = await getContentRows<T>(table);
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
