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
  
  const { data: projects } = await supabase.from('projects').select('title, imageUrl, description, seoTitle, metaTitle, seoDesc');
  let matchedItem = null;
  
  if (projects) {
    matchedItem = projects.find((n: any) => generateSlug(n.title) === slug);
  }

  if (!matchedItem) {
    return {
      title: "Dự án | Greenia Homes",
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

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ClientWrapper slug={slug} />;
}
