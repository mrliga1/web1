import type { Metadata } from "next";
import { generateSlug } from "../../../src/lib/utils";
import { supabase } from "../../../src/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  let title = `Bất Động Sản ${decodedName.replace(/-/g, " ")}`;
  let description = `Khám phá các sản phẩm nổi bật thuộc danh mục ${decodedName.replace(/-/g, " ")}.`;

  const { data, error } = await supabase
    .from("settings")
    .select("data")
    .eq("id", "general")
    .maybeSingle();

  if (error) {
    console.error("Không thể tải metadata danh mục sản phẩm:", error);
  } else {
    const categories = data?.data?.productCategoriesExt || [];
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
    }
  }

  title = removeTrailingBrand(title) || title;
  const brandedTitle = `${title} | Greenia Homes`;
  const canonical = `https://greeniahomes.vn/category-product/${canonicalSlug}`;

  return {
    title,
    description,
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
