// Trang chi tiết sản phẩm - nhận slug từ params động
import ClientApp from "../../ClientApp";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ClientApp initialScreen="product-detail" slug={slug} />;
}
