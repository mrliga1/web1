import { Metadata, ResolvingMetadata } from "next";
import ClientWrapper from "./ClientWrapper";
import { supabase } from "../../../src/supabase";
import { generateSlug } from "../../../src/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

let productsPromise: Promise<any> | null = null;
let cacheTime = 0;

async function getProducts() {
  if (productsPromise && Date.now() - cacheTime < 60000) return productsPromise;
  productsPromise = supabase.from('products').select('data').then(res => res.data) as Promise<any>;
  cacheTime = Date.now();
  return productsPromise;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  const products = await getProducts();
  let matchedItem = null;
  
  if (products) {
    matchedItem = products.find((n: any) => generateSlug(n.data?.title || '') === slug);
  }

  if (!matchedItem || !matchedItem.data) {
    return {
      title: "Sản phẩm | Greenia Homes",
    };
  }

  const itemData = matchedItem.data;
  const title = itemData.seoTitle?.trim() || itemData.metaTitle?.trim() || itemData.title?.trim() || "";
  const finalTitle = title.includes("|") ? title : `${title} | Greenia Homes`;

  // Tự động tạo mô tả rich text với icon
  const location = itemData.district || "Đang cập nhật";
  const price = itemData.priceText || "Thỏa thuận";
  const area = itemData.area ? `${itemData.area}m2` : "";
  const bedrooms = itemData.bedrooms ? `${itemData.bedrooms} PN` : "";
  
  let richDesc = `📍 Vị trí: ${location} | 💰 Giá: ${price}`;
  if (area) richDesc += ` | 📐 Diện tích: ${area}`;
  if (bedrooms) richDesc += ` | 🛏️ ${bedrooms}`;
  richDesc += `. Khám phá chi tiết tại Greenia Homes!`;

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

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ClientWrapper slug={slug} />;
}
