// Trang danh mục tin tức - nhận tên danh mục từ params và giải mã URI
import ClientWrapper from "./ClientWrapper";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoryNewsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <ClientWrapper categoryName={decodeURIComponent(name)} />;
}
