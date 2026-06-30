// Trang danh mục tin tức - nhận tên danh mục từ params và giải mã URI
import ClientApp from "../../ClientApp";

export default async function CategoryNewsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <ClientApp initialScreen="category-news" categoryName={decodeURIComponent(name)} />;
}
