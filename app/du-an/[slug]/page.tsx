import { Metadata, ResolvingMetadata } from "next";
import ClientWrapper from "./ClientWrapper";
import { supabase } from "../../../src/supabase";
import { generateSlug } from "../../../src/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

let projectsPromise: Promise<any> | null = null;
let cacheTime = 0;

async function getProjects() {
  if (projectsPromise && Date.now() - cacheTime < 60000) return projectsPromise;
  projectsPromise = supabase.from('projects').select('data').then(res => res.data);
  cacheTime = Date.now();
  return projectsPromise;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  const projects = await getProjects();
  let matchedItem = null;
  
  if (projects) {
    matchedItem = projects.find((n: any) => generateSlug(n.data?.title || '') === slug);
  }

  if (!matchedItem || !matchedItem.data) {
    return {
      title: "Dự án | Greenia Homes",
    };
  }

  const itemData = matchedItem.data;
  const title = itemData.seoTitle?.trim() || itemData.metaTitle?.trim() || itemData.title?.trim() || "";
  const finalTitle = title.includes("|") ? title : `${title} | Greenia Homes`;

  // Tự động tạo mô tả rich text với icon
  const location = itemData.district || itemData.location || "Đang cập nhật";
  const price = itemData.priceText || "Đang cập nhật";
  const area = itemData.area ? `${itemData.area}m2` : "";
  
  let richDesc = `📍 Vị trí: ${location} | 💰 Giá: ${price}`;
  if (area) richDesc += ` | 📐 Diện tích: ${area}`;
  richDesc += `. Tìm hiểu dự án ngay tại Greenia Homes!`;

  const finalDescription = itemData.seoDesc || richDesc;

  return {
    title: finalTitle,
    description: finalDescription,
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      images: itemData.imageUrl ? [itemData.imageUrl] : [],
    }
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ClientWrapper slug={slug} />;
}
