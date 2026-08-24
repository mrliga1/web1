import { createStaticPageMetadata } from '../../src/lib/internalLinks';

export const metadata = createStaticPageMetadata({
  title: 'Liên hệ',
  description: 'Liên hệ Greenia Homes để được tư vấn bất động sản chuyên nghiệp. Hotline: 0932 966 700.',
  path: '/lien-he',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
