import { createStaticPageMetadata } from '../../src/lib/internalLinks';

export const metadata = createStaticPageMetadata({
  title: 'Chính sách bảo mật',
  description: 'Chính sách bảo mật thông tin cá nhân của Greenia Homes. Cam kết bảo vệ dữ liệu khách hàng.',
  path: '/chinh-sach-bao-mat',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
