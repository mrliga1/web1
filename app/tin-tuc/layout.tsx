import { createStaticPageMetadata } from '../../src/lib/internalLinks';

export const metadata = createStaticPageMetadata({
  title: 'Tin tức bất động sản',
  description: 'Tin tức bất động sản mới nhất. Phân tích thị trường, xu hướng đầu tư, kiến thức mua bán nhà đất.',
  path: '/tin-tuc',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
