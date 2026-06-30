// Trang chi tiết tin tức - nhận slug từ params động
import ClientApp from "../../ClientApp";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ClientApp initialScreen="news-detail" slug={slug} />;
}
