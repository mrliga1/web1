import { Metadata, ResolvingMetadata } from "next";
import ClientWrapper from "./ClientWrapper";
import { supabase } from "../../../src/supabase";
import { generateSlug } from "../../../src/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  const { data: products } = await supabase.from('products').select('title, imageUrl, description, seoTitle, metaTitle, seoDesc');
  let matchedItem = null;
  
  if (products) {
    matchedItem = products.find((n: any) => generateSlug(n.title) === slug);
  }

  if (!matchedItem) {
    return {
      title: "Sản phẩm | Greenia Homes",
    };
  }

  const title = matchedItem.seoTitle?.trim() || matchedItem.metaTitle?.trim() || matchedItem.title?.trim() || "";
  const finalTitle = title.includes("|") ? title : `${title} | Greenia Homes`;

  return {
    title: finalTitle,
    description: matchedItem.seoDesc || (matchedItem.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
    openGraph: {
      title: finalTitle,
      description: matchedItem.seoDesc || (matchedItem.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
      images: matchedItem.imageUrl ? [matchedItem.imageUrl] : [],
    }
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ClientWrapper slug={slug} />;
}
