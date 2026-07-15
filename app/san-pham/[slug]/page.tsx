import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import { getProductBySlug } from "../../../src/lib/serverContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL = "https://greeniahomes.vn";

type Props = {
  params: Promise<{ slug: string }>;
};

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
  const description =
    product.seoDesc?.trim() ||
    product.metaDesc?.trim() ||
    `Vị trí: ${location} | Giá: ${price}${area}${bedrooms}. Xem thông tin chi tiết tại Greenia Homes.`;
  const canonical = `${SITE_URL}/san-pham/${slug}`;
  const images = product.imageUrl ? [product.imageUrl] : [`${SITE_URL}/og-image.jpg`];

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

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return <ClientWrapper slug={slug} initialProduct={product} />;
}
