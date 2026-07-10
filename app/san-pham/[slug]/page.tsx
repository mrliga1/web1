import { Metadata, ResolvingMetadata } from "next";
import ClientWrapper from "./ClientWrapper";
import { supabase } from "../../../src/supabase";
import { generateSlug } from "../../../src/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  const { data: products } = await supabase.from('products').select('data');
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

  return {
    title: finalTitle,
    description: itemData.seoDesc || (itemData.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
    openGraph: {
      title: finalTitle,
      description: itemData.seoDesc || (itemData.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
      images: itemData.imageUrl ? [itemData.imageUrl] : [],
    }
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ClientWrapper slug={slug} />;
}
