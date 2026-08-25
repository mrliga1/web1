import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import {
  getProductBySlug,
  getPublicSettings,
  getPublishedProducts,
  getPublishedProjects,
} from "../../../src/lib/serverContent";
import { createProductSchemas } from "../../../src/lib/contentSchemas";
import SchemaMarkup from "../../../src/components/SchemaMarkup";
import { generateSlug, getSocialImageUrl } from "../../../src/lib/utils";
import { createSearchDescription, getSemanticTerms } from "../../../src/lib/searchIntent";

export const revalidate = 60;

const SITE_URL = "https://greeniahomes.vn";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const rows = await getPublishedProducts();
  return rows
    .filter(({ data }) => data.title?.trim())
    .map(({ data }) => ({ slug: generateSlug(data.title) }));
}

function removeTrailingBrand(title: string) {
  return title.replace(/\s*[|–-]\s*Greenia Homes\s*$/i, "").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Sản phẩm không tồn tại",
      robots: { index: false, follow: false },
    };
  }

  const sourceTitle =
    product.seoTitle?.trim() ||
    product.metaTitle?.trim() ||
    product.title.trim();
  const title = removeTrailingBrand(sourceTitle) || product.title.trim();
  const brandedTitle = `${title} | Greenia Homes`;
  const location = product.district || "Đang cập nhật";
  const price = product.priceText || "Thỏa thuận";
  const area = product.area ? ` | Diện tích: ${product.area}m²` : "";
  const bedrooms = product.bedrooms ? ` | ${product.bedrooms} phòng ngủ` : "";
  const canonical = `${SITE_URL}/san-pham/${slug}`;
  const description = createSearchDescription({
    path: canonical,
    source: product.seoDesc?.trim() || product.metaDesc?.trim(),
    fallback: `Vị trí: ${location} | Giá: ${price}${area}${bedrooms}. Xem thông tin chi tiết tại Greenia Homes.`,
  });
  const socialImage = getSocialImageUrl(product.imageUrl);
  const images = [{ url: socialImage, width: 1200, height: 630, alt: product.title, type: "image/jpeg" }];
  const keywords = getSemanticTerms({
    path: canonical,
    title: product.title,
    category: product.category,
    location: product.district || product.location,
    attributes: [product.type === "rent" ? "bất động sản cho thuê" : "bất động sản chuyển nhượng", product.legalStatus],
    customKeywords: product.seoKeywords || product.metaKeywords,
  });

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
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: [{ url: socialImage, alt: product.title }],
    },
    other: {
      "geo.region": "VN-SG",
      "geo.placename": product.district
        ? `${product.district}, Hồ Chí Minh`
        : "Hồ Chí Minh, Việt Nam",
      ...(product.latitude != null && product.longitude != null
        ? {
            "geo.position": `${product.latitude};${product.longitude}`,
            ICBM: `${product.latitude}, ${product.longitude}`,
          }
        : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const [product, productRows, projectRows, generalSettings] = await Promise.all([
    getProductBySlug(slug),
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
  ]);

  if (!product) notFound();

  const { listing, breadcrumb, webPage } = createProductSchemas(product, slug);

  return (
    <>
      <SchemaMarkup schema={webPage} />
      <SchemaMarkup schema={listing} />
      <SchemaMarkup schema={breadcrumb} />
      <ClientWrapper
        slug={slug}
        initialProduct={product}
        initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
        initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
        initialGeneralSettings={generalSettings}
      />
    </>
  );
}
