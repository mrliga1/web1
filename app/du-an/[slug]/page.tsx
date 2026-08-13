import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import {
  getProjectBySlug,
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
  toNewsListItem,
  toProductListItem,
  toProjectListItem,
} from "../../../src/lib/serverContent";
import { createProjectSchemas } from "../../../src/lib/contentSchemas";
import SchemaMarkup from "../../../src/components/SchemaMarkup";
import { generateSlug, getSocialImageUrl } from "../../../src/lib/utils";

export const revalidate = 60;

const SITE_URL = "https://greeniahomes.vn";
const PROJECT_ASSET_REPLACEMENTS: Record<string, string> = {
  "vinhomes-saigon-park-1-1781806643258.webp": "vinhomes-saigon-park-1-1780609285395.webp",
  "phoi-cnh-vinhomes-saigon-park-1-1781806400977.webp": "phoi-cnh-vinhomes-saigon-park-1-1780610276714.webp",
  "phoi-cnh-vinhomes-saigon-park-2-1781806428580.webp": "phoi-cnh-vinhomes-saigon-park-2-1780610305698.webp",
  "mat-bang-tien-ich-vinhomes-saigon-park-1781806443405.webp": "mat-bang-tien-ich-vinhomes-saigon-park-1780610350955.webp",
  "vinhomes-saigon-park-5-1781806460409.webp": "vinhomes-saigon-park-5-1780609575960.webp",
  "vinhomes-saigon-park-4-1781806481868.webp": "vinhomes-saigon-park-3-1780609510668.webp",
  "vinhomes-saigon-park-2-1781806532525.webp": "vinhomes-saigon-park-2-1780609423834.webp",
  "tien-ich-vinhomes-saigon-park-3-1781806554429.webp": "tien-ich-vinhomes-saigon-park-3-1780610628768.webp",
  "cong-vien-vinwonrder-saigon-park1-1781806591634.webp": "cong-vien-vinwonrder-saigon-park1-1780610480680.webp",
  "vinwonrder-saigon-park-1781806621598.webp": "vinwonrder-saigon-park-1780610393757.webp",
  "tien-ich-vinhomes-saigon-park-2-1781806678461.webp": "tien-ich-vinhomes-saigon-park-2-1780610600359.webp",
  "vuon-hoa-vinhomes-saigon-park-1781806711765.webp": "vuon-hoa-vinhomes-saigon-park-1780610896882.webp",
  "nha-pho-vinhomes-saigon-park-1780242562020.webp": "nha-pho-vinhomes-saigon-park-1779377463400.webp",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const rows = await getPublishedProjects();
  return rows
    .filter(({ data }) => data.title?.trim())
    .map(({ data }) => ({ slug: generateSlug(data.title) }));
}

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

function replaceKnownProjectAssets<T>(value: T): T {
  let serialized = JSON.stringify(value);
  for (const [missingName, availableName] of Object.entries(PROJECT_ASSET_REPLACEMENTS)) {
    serialized = serialized.replaceAll(missingName, availableName);
  }
  return JSON.parse(serialized) as T;
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

  const optimizedProject = replaceKnownProjectAssets(project);

  const newsCategoryTarget = getCategoryTarget(optimizedProject.newsCategoryUrl).toLowerCase();
  const productCategoryTarget = getCategoryTarget(optimizedProject.productCategoryUrl).toLowerCase();
  const news = newsRows.map(({ id, data }) => ({ ...data, id }));
  const products = productRows.map(({ id, data }) => ({ ...data, id }));
  const relatedNewsRows = (
    newsCategoryTarget
      ? news.filter((item) => item.category?.trim().toLowerCase() === newsCategoryTarget)
      : news
  ).slice(0, 6);
  const relatedProductRows = (
    productCategoryTarget
      ? products.filter((item) => item.category?.trim().toLowerCase() === productCategoryTarget)
      : products
  ).slice(0, 5);

  const { listing, breadcrumb } = createProjectSchemas(optimizedProject, slug);

  return (
    <>
      <SchemaMarkup schema={listing} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper
        slug={slug}
        initialProject={optimizedProject}
        initialNews={relatedNewsRows.map((item) => toNewsListItem(item.id, item))}
        initialProducts={relatedProductRows.map((item) => toProductListItem(item.id, item))}
        initialProjects={projectRows.slice(0, 5).map(({ id, data }) => toProjectListItem(id, data))}
      />
    </>
  );
}
