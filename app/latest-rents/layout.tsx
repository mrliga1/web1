import { createStaticPageMetadata } from '../../src/lib/internalLinks';

export const metadata = createStaticPageMetadata({
  title: 'Bất động sản cho thuê mới nhất',
  description: 'Khám phá danh sách bất động sản cho thuê mới nhất tại Greenia Homes. Cập nhật liên tục các căn hộ, nhà phố cho thuê giá tốt.',
  path: '/latest-rents',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
