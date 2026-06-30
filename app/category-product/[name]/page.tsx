// Trang danh mục sản phẩm - nhận tên danh mục từ params và giải mã URI
import ClientApp from "../../ClientApp";

export default async function CategoryProductPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <ClientApp initialScreen="category-product" categoryName={decodeURIComponent(name)} />;
}
