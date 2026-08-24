import { createStaticPageMetadata } from '../../src/lib/internalLinks';

export const metadata = createStaticPageMetadata({
  title: 'Dự án bất động sản',
  description: 'Các dự án bất động sản nổi bật tại TP.HCM. Thông tin chi tiết, tiến độ, giá bán từ Greenia Homes.',
  path: '/du-an',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
