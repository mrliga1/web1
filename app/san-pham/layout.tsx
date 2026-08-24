import { createStaticPageMetadata } from '../../src/lib/internalLinks';

export const metadata = createStaticPageMetadata({
  title: 'Bất động sản',
  description: 'Danh sách sản phẩm bất động sản tại Greenia Homes. Tìm kiếm căn hộ, nhà phố, biệt thự phù hợp nhu cầu.',
  path: '/san-pham',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
