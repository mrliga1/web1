import { createStaticPageMetadata } from '../../src/lib/internalLinks';

export const metadata = createStaticPageMetadata({
  title: 'Bất động sản chuyển nhượng mới nhất',
  description: 'Danh sách bất động sản chuyển nhượng mới nhất. Tìm kiếm căn hộ, nhà phố, biệt thự giá tốt tại Greenia Homes.',
  path: '/latest-sales',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
