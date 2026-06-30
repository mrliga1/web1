// Trang chi tiết dự án - nhận slug từ params động
import ClientApp from "../../ClientApp";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ClientApp initialScreen="project-detail" slug={slug} />;
}
