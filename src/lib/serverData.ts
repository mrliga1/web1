import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_HOME_SECTIONS } from "./layouts";
import {
  deserializeSectionsFromDatabase,
  sanitizeHomeSections,
} from "./layoutUtils";
import { optimizeImageUrl } from "./utils";
import type { News, Product, Project, VisualSection } from "../types";

type UnknownRecord = Record<string, unknown>;

export interface HomePageInitialData {
  sections: VisualSection[];
  products: Product[];
  projects: Project[];
  news: News[];
  needsClientRefresh: boolean;
}

export interface InitialSiteSettings {
  logoUrl: string;
  loaded: boolean;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createPublicServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Thiếu cấu hình Supabase công khai cho quá trình render phía server.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getDefaultHomeSections(): VisualSection[] {
  return sanitizeHomeSections(DEFAULT_HOME_SECTIONS) as VisualSection[];
}

function unwrapRows<T>(rows: unknown): T[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row) => {
    if (!isRecord(row) || typeof row.id !== "string" || !isRecord(row.data)) {
      return [];
    }

    return [{ id: row.id, ...row.data } as T];
  });
}

function getCreatedAtTimestamp(value: unknown): number {
  if (typeof value !== "string") return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function reportReadError(resource: string, error: unknown) {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (isRecord(error) && typeof error.message === "string") {
    message = error.message;
  } else {
    try {
      message = JSON.stringify(error);
    } catch {
      message = String(error);
    }
  }

  console.error(`Không thể tải ${resource} khi render phía server: ${message}`);
}

export async function getHomePageInitialData(): Promise<HomePageInitialData> {
  const fallback: HomePageInitialData = {
    sections: getDefaultHomeSections(),
    products: [],
    projects: [],
    news: [],
    needsClientRefresh: true,
  };

  try {
    const supabase = createPublicServerClient();
    const [layoutResult, productsResult, projectsResult, newsResult] =
      await Promise.all([
        supabase.from("layouts").select("id,data").eq("id", "home").maybeSingle(),
        supabase.from("products").select("id,data"),
        supabase.from("projects").select("id,data"),
        supabase.from("news").select("id,data"),
      ]);

    if (layoutResult.error) reportReadError("bố cục trang chủ", layoutResult.error);
    if (productsResult.error) reportReadError("sản phẩm trang chủ", productsResult.error);
    if (projectsResult.error) reportReadError("dự án trang chủ", projectsResult.error);
    if (newsResult.error) reportReadError("tin tức trang chủ", newsResult.error);

    const layoutPayload = isRecord(layoutResult.data?.data)
      ? layoutResult.data.data
      : null;
    const rawSections = layoutPayload?.sections;
    const loadedSections = Array.isArray(rawSections)
      ? deserializeSectionsFromDatabase(rawSections)
      : [];
    const sections = loadedSections.length > 0
      ? (sanitizeHomeSections(loadedSections) as VisualSection[])
      : fallback.sections;

    const products = unwrapRows<Product>(productsResult.data)
      .filter((product) => !product.approvalStatus || product.approvalStatus === "approved")
      .sort(
        (left, right) =>
          getCreatedAtTimestamp(right.createdAt) - getCreatedAtTimestamp(left.createdAt),
      );

    const projects = unwrapRows<Project>(projectsResult.data).filter(
      (project) => !project.approvalStatus || project.approvalStatus === "approved",
    );

    const news = unwrapRows<News>(newsResult.data)
      .filter(
        (article) =>
          (!article.approvalStatus || article.approvalStatus === "approved") &&
          Boolean(article.title?.trim()),
      )
      .sort(
        (left, right) =>
          getCreatedAtTimestamp(right.createdAt) - getCreatedAtTimestamp(left.createdAt),
      );

    return {
      sections,
      products,
      projects,
      news,
      needsClientRefresh: Boolean(
        layoutResult.error ||
          productsResult.error ||
          projectsResult.error ||
          newsResult.error,
      ),
    };
  } catch (error) {
    reportReadError("dữ liệu trang chủ", error);
    return fallback;
  }
}

async function loadInitialSiteSettings(): Promise<InitialSiteSettings> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("settings")
      .select("id,data")
      .eq("id", "general")
      .maybeSingle();

    if (error) {
      reportReadError("cấu hình nhận diện thương hiệu", error);
      return { logoUrl: "", loaded: false };
    }

    const settings = isRecord(data?.data) ? data.data : null;
    const logoUrl = typeof settings?.logoUrl === "string" ? settings.logoUrl : "";

    return {
      logoUrl: optimizeImageUrl(logoUrl, 100),
      loaded: true,
    };
  } catch (error) {
    reportReadError("cấu hình nhận diện thương hiệu", error);
    return { logoUrl: "", loaded: false };
  }
}

export const getInitialSiteSettings = cache(loadInitialSiteSettings);
