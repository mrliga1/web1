import { Metadata, ResolvingMetadata } from "next";
import ClientWrapper from "./ClientWrapper";
import { supabase } from "../../../src/supabase";
import { generateSlug } from "../../../src/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

let newsPromise: Promise<any> | null = null;
let cacheTime = 0;

async function getNews() {
  if (newsPromise && Date.now() - cacheTime < 60000) return newsPromise;
  newsPromise = supabase.from('news').select('data').then(res => res.data) as Promise<any>;
  cacheTime = Date.now();
  return newsPromise;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  const news = await getNews();
  let matchedNews = null;
  
  if (news) {
    matchedNews = news.find((n: any) => generateSlug(n.data?.title || '') === slug);
  }

  if (!matchedNews || !matchedNews.data) {
    return {
      title: "Tin tức | Greenia Homes",
    };
  }

  const newsData = matchedNews.data;
  const title = newsData.seoTitle?.trim() || newsData.metaTitle?.trim() || newsData.title?.trim() || "";
  const finalTitle = title.includes("|") ? title : `${title} | Greenia Homes`;

  return {
    title: finalTitle,
    description: newsData.seoDesc || (newsData.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
    openGraph: {
      title: finalTitle,
      description: newsData.seoDesc || (newsData.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
      images: newsData.imageUrl ? [newsData.imageUrl] : [],
    }
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ClientWrapper slug={slug} />;
}
