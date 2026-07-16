import type { Metadata } from "next";
import { generateSlug } from "../../../src/lib/utils";
import { supabase } from "../../../src/supabase";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ name: string }>;
};

function removeTrailingBrand(title: string) {
  return title.replace(/\s*[|–-]\s*Greenia Homes\s*$/i, "").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  let canonicalSlug = generateSlug(decodedName);
  let title = `Tin Tức ${decodedName.replace(/-/g, " ")}`;
  let description = `Cập nhật tin tức mới nhất về ${decodedName.replace(/-/g, " ")}.`;
  let keywords: string | undefined;

  const { data, error } = await supabase
    .from("settings")
    .select("data")
    .eq("id", "general")
    .maybeSingle();

  if (error) {
    console.error("Không thể tải metadata danh mục tin tức:", error);
  } else {
    const categories = data?.data?.newsCategoriesExt || [];
    const category = categories.find((item: { name?: string }) => {
      return (
        item.name === decodedName ||
        generateSlug(item.name || "") === generateSlug(decodedName)
      );
    });

    if (category?.name) {
      canonicalSlug = generateSlug(category.name);
      title = category.seoTitle || category.name || title;
      description = category.seoDesc || category.description || description;
      keywords = category.seoKeywords || undefined;
    }
  }

  title = removeTrailingBrand(title) || title;
  const brandedTitle = `${title} | Greenia Homes`;
  const canonical = `https://greeniahomes.vn/category-news/${canonicalSlug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: "Greenia Homes",
      title: brandedTitle,
      description,
      url: canonical,
      images: ["https://greeniahomes.vn/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: ["https://greeniahomes.vn/og-image.jpg"],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
