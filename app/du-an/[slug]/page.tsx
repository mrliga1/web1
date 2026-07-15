import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import { getProjectBySlug } from "../../../src/lib/serverContent";

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
  const images = project.imageUrl ? [project.imageUrl] : [`${SITE_URL}/og-image.jpg`];

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

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return <ClientWrapper slug={slug} initialProject={project} />;
}
