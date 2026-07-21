import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import {
  getProjectBySlug,
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
} from "../../../src/lib/serverContent";
import { createProjectSchemas } from "../../../src/lib/contentSchemas";
import SchemaMarkup from "../../../src/components/SchemaMarkup";
import { getSocialImageUrl } from "../../../src/lib/utils";

export const revalidate = 60;

const SITE_URL = "https://greeniahomes.vn";

type Props = {
  params: Promise<{ slug: string }>;
};

function getCategoryTarget(value?: string) {
  if (!value) return "";
  const trimmedValue = value.trim();
  const categoryMatch = trimmedValue.match(/[?&]categoryName=([^&]+)/);
  if (!categoryMatch) return trimmedValue;

  try {
    return decodeURIComponent(categoryMatch[1].replace(/\+/g, " ")).trim();
  } catch {
    return categoryMatch[1].trim();
  }
}

function removeTrailingBrand(title: string) {
  return title.replace(/\s*[|–-]\s*Greenia Homes\s*$/i, "").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Dự án không tồn tại",
      robots: { index: false, follow: false },
    };
  }

  const sourceTitle =
    project.seoTitle?.trim() ||
    project.metaTitle?.trim() ||
    project.title.trim();
  const title = removeTrailingBrand(sourceTitle) || project.title.trim();
  const brandedTitle = `${title} | Greenia Homes`;
  const location = project.location || "Đang cập nhật";
  const price = project.priceText || "Đang cập nhật";
  const description =
    project.seoDesc?.trim() ||
    project.metaDesc?.trim() ||
    `Vị trí: ${location} | Giá: ${price}. Xem thông tin dự án tại Greenia Homes.`;
  const canonical = `${SITE_URL}/du-an/${slug}`;
  const socialImage = getSocialImageUrl(project.imageUrl);
  const images = [{ url: socialImage, width: 1200, height: 630, alt: project.title, type: "image/jpeg" }];

  return {
    title,
    description,
    keywords: project.seoKeywords?.trim() || project.metaKeywords?.trim() || undefined,
    alternates: { canonical },
    openGraph: {
      type: "website",
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
      images: [{ url: socialImage, alt: project.title }],
    },
    other: {
      "geo.region": "VN-SG",
      "geo.placename": "Hồ Chí Minh, Việt Nam",
      ...(project.latitude != null && project.longitude != null
        ? {
            "geo.position": `${project.latitude};${project.longitude}`,
            ICBM: `${project.latitude}, ${project.longitude}`,
          }
        : {}),
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const [project, newsRows, productRows, projectRows] = await Promise.all([
    getProjectBySlug(slug),
    getPublishedNews(),
    getPublishedProducts(),
    getPublishedProjects(),
  ]);

  if (!project) notFound();

  const newsCategoryTarget = getCategoryTarget(project.newsCategoryUrl).toLowerCase();
  const productCategoryTarget = getCategoryTarget(project.productCategoryUrl).toLowerCase();
  const news = newsRows.map(({ id, data }) => ({ ...data, id }));
  const products = productRows.map(({ id, data }) => ({ ...data, id }));
  const relatedNews = (
    newsCategoryTarget
      ? news.filter((item) => item.category?.trim().toLowerCase() === newsCategoryTarget)
      : news
  ).slice(0, 6);
  const relatedProducts = (
    productCategoryTarget
      ? products.filter((item) => item.category?.trim().toLowerCase() === productCategoryTarget)
      : products
  ).slice(0, 5);

  const { listing, breadcrumb } = createProjectSchemas(project, slug);

  return (
    <>
      <SchemaMarkup schema={listing} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper
        slug={slug}
        initialProject={project}
        initialNews={relatedNews}
        initialProducts={relatedProducts}
        initialProjects={projectRows.slice(0, 5).map(({ id, data }) => ({ ...data, id }))}
      />
    </>
  );
}
