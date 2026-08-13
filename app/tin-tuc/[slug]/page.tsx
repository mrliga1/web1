import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createHash } from "node:crypto";
import ClientWrapper from "./ClientWrapper";
import {
  getNewsBySlug,
  getPublicSettings,
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
  toNewsListItem,
  toProductListItem,
  toProjectListItem,
} from "../../../src/lib/serverContent";
import { createNewsSchemas } from "../../../src/lib/contentSchemas";
import SchemaMarkup from "../../../src/components/SchemaMarkup";
import { generateSlug, getSocialImageUrl } from "../../../src/lib/utils";

export const revalidate = 60;

const SITE_URL = "https://greeniahomes.vn";
const EMBEDDED_IMAGE_PATTERN = /data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi;
const EMBEDDED_NEWS_IMAGE_URLS: Record<string, string> = {
  "75ebd83715931ae4deae283783e5b21bb7e580b359b9e9413f95e53f6e8241f3":
    "/uploads/ha-tang-tay-bac-tphcm-vinhomes-saigon-park-content.webp",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const rows = await getPublishedNews();
  return rows
    .filter(({ data }) => data.title?.trim())
    .map(({ data }) => ({ slug: generateSlug(data.title) }));
}

function removeTrailingBrand(title: string) {
  return title.replace(/\s*[|–-]\s*Greenia Homes\s*$/i, "").trim();
}

function plainText(value: string) {
  return value.replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim();
}

function replaceKnownEmbeddedImages(value: string) {
  return value.replace(EMBEDDED_IMAGE_PATTERN, (source) => {
    try {
      const payload = source.slice(source.indexOf(",") + 1);
      const hash = createHash("sha256").update(Buffer.from(payload, "base64")).digest("hex");
      return EMBEDDED_NEWS_IMAGE_URLS[hash] || source;
    } catch {
      return source;
    }
  });
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
  const socialImage = getSocialImageUrl(article.imageUrl);
  const images = [{ url: socialImage, width: 1200, height: 630, alt: article.title, type: "image/jpeg" }];

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
      images: [{ url: socialImage, alt: article.title }],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [article, newsRows, productRows, projectRows, generalSettings] = await Promise.all([
    getNewsBySlug(slug),
    getPublishedNews(),
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
  ]);

  if (!article) notFound();

  const optimizedArticle = {
    ...article,
    content: replaceKnownEmbeddedImages(article.content || ""),
  };

  const { article: articleSchema, breadcrumb } = createNewsSchemas(optimizedArticle, slug);

  return (
    <>
      <SchemaMarkup schema={articleSchema} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper
        slug={slug}
        initialArticle={optimizedArticle}
        initialNews={newsRows.map(({ id, data }) => toNewsListItem(id, data))}
        initialProducts={productRows.map(({ id, data }) => toProductListItem(id, data))}
        initialProjects={projectRows.map(({ id, data }) => toProjectListItem(id, data))}
        initialGeneralSettings={generalSettings}
      />
    </>
  );
}
