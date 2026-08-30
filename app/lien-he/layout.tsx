import { getManagedStaticMetadata } from '../../src/lib/staticSeo';
import SchemaMarkup from '../../src/components/SchemaMarkup';
import { createWebPageSchemas } from '../../src/lib/contentSchemas';

const pageDescription = 'Liên hệ Greenia Homes để được tư vấn bất động sản chuyên nghiệp. Hotline: 0932 966 700.';
const { webPage, breadcrumb } = createWebPageSchemas({
  path: '/lien-he',
  name: 'Liên hệ Greenia Homes',
  description: pageDescription,
  topics: ['Tư vấn bất động sản', 'Ký gửi nhà đất', 'Greenia Homes Quận 7'],
  breadcrumbs: [
    { name: 'Trang chủ', path: '/' },
    { name: 'Liên hệ', path: '/lien-he' },
  ],
});

export const generateMetadata = () => getManagedStaticMetadata('/lien-he');

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaMarkup schema={webPage} />
      <SchemaMarkup schema={breadcrumb} />
      {children}
    </>
  );
}
