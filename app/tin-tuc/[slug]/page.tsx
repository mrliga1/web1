import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import { getNewsBySlug } from "../../../src/lib/serverContent";
import { createNewsSchemas } from "../../../src/lib/contentSchemas";
import SchemaMarkup from "../../../src/components/SchemaMarkup";

export const revalidate = 60;

const SITE_URL = "https://greeniahomes.vn";

type Props = {
  params: Promise<{ slug: string }>;
};

function removeTrailingBrand(title: string) {
  return title.replace(/\s*[|–-]\s*Greenia Homes\s*$/i, "").trim();
}

function plainText(value: string) {
  return value.replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) {
    return {
      title: "Tin tức không tồn tại",
      robots: { index: false, follow: false },
    };
  }

  const sourceTitle =
    article.seoTitle?.trim() ||
    article.metaTitle?.trim() ||
    article.title.trim();
  const title = removeTrailingBrand(sourceTitle) || article.title.trim();
  const brandedTitle = `${title} | Greenia Homes`;
  const description = (
    article.seoDesc?.trim() ||
    article.metaDesc?.trim() ||
    plainText(article.description || article.content || "")
  ).slice(0, 160);
  const canonical = `${SITE_URL}/tin-tuc/${slug}`;
  const images = article.imageUrl ? [article.imageUrl] : [`${SITE_URL}/og-image.jpg`];

  return {
    title,
    description,
    keywords: article.seoKeywords?.trim() || article.metaKeywords?.trim() || undefined,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "vi_VN",
      siteName: "Greenia Homes",
      title: brandedTitle,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images,
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) notFound();

  const { article: articleSchema, breadcrumb } = createNewsSchemas(article, slug);

  return (
    <>
      <SchemaMarkup schema={articleSchema} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper slug={slug} initialArticle={article} />
    </>
  );
}
