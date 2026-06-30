import ClientApp from "./ClientApp";

/**
 * Trang chủ - Server Component.
 * App.tsx sẽ tự nhận pathname "/" và hiển thị home.
 */
export default function HomePage() {
  return <ClientApp initialScreen="home" />;
}
