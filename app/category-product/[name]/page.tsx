// Trang danh mục sản phẩm - nhận tên danh mục từ params và giải mã URI
import ClientWrapper from "./ClientWrapper";

export default async function CategoryProductPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <ClientWrapper categoryName={decodeURIComponent(name)} />;
}
