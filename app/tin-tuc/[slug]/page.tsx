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
  
  const { data: news } = await supabase.from('news').select('title, imageUrl, description, seoTitle, metaTitle, seoDesc');
  let matchedNews = null;
  
  if (news) {
    matchedNews = news.find((n: any) => generateSlug(n.title) === slug);
  }

  if (!matchedNews) {
    return {
      title: "Tin tức | Greenia Homes",
    };
  }

  const title = matchedNews.seoTitle?.trim() || matchedNews.metaTitle?.trim() || matchedNews.title?.trim() || "";
  const finalTitle = title.includes("|") ? title : `${title} | Greenia Homes`;

  return {
    title: finalTitle,
    description: matchedNews.seoDesc || (matchedNews.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
    openGraph: {
      title: finalTitle,
      description: matchedNews.seoDesc || (matchedNews.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
      images: matchedNews.imageUrl ? [matchedNews.imageUrl] : [],
    }
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ClientWrapper slug={slug} />;
}
