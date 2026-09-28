import type { Metadata } from "next";
import { generateSlug } from "../../../src/lib/utils";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublicSettings, getPublishedProducts } from "../../../src/lib/serverContent";
import { CORE_INTERNAL_LINKS } from "../../../src/lib/internalLinks";
import { createSearchDescription, getSemanticTerms } from "../../../src/lib/searchIntent";

export const revalidate = 60;

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
  let keywords: string | undefined;

  const [settings, rows] = await Promise.all([getPublicSettings("general"), getPublishedProducts()]);
  const categories = settings.productCategoriesExt || [];
  const category = categories.find((item) => item.name === decodedName || generateSlug(item.name || "") === canonicalSlug);
  const known = category || CORE_INTERNAL_LINKS.some((link) => link.href === `/category-product/${canonicalSlug}`) || rows.some(({ data }) => generateSlug(data.category || "") === canonicalSlug);
  if (!known) notFound();
  if (category?.name) {
    canonicalSlug = generateSlug(category.name);
    title = category.seoTitle || category.name;
    description = category.seoDesc || category.description || description;
    keywords = category.seoKeywords || undefined;
  }
  if (name !== canonicalSlug) permanentRedirect(`/category-product/${canonicalSlug}`);

  title = removeTrailingBrand(title) || title;
  const brandedTitle = `${title} | Greenia Homes`;
  const canonical = `https://greeniahomes.vn/category-product/${canonicalSlug}`;
  description = createSearchDescription({
    path: canonical,
    source: description,
    fallback: `Khám phá các sản phẩm nổi bật thuộc danh mục ${decodedName.replace(/-/g, " ")}.`,
  });
  const semanticKeywords = getSemanticTerms({
    path: canonical,
    title,
    category: decodedName.replace(/-/g, " "),
    customKeywords: keywords,
  });

  return {
    title,
    description,
    keywords: semanticKeywords,
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
