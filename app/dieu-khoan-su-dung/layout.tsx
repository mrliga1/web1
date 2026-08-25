import { createStaticPageMetadata } from '../../src/lib/internalLinks';
import SchemaMarkup from '../../src/components/SchemaMarkup';
import { createWebPageSchemas } from '../../src/lib/contentSchemas';

const pageDescription = 'Điều khoản sử dụng website Greenia Homes. Quy định về quyền và trách nhiệm khi sử dụng dịch vụ.';
const { webPage, breadcrumb } = createWebPageSchemas({
  path: '/dieu-khoan-su-dung',
  name: 'Điều khoản sử dụng',
  description: pageDescription,
  topics: ['Điều khoản dịch vụ', 'Quy định sử dụng website'],
  breadcrumbs: [
    { name: 'Trang chủ', path: '/' },
    { name: 'Điều khoản sử dụng', path: '/dieu-khoan-su-dung' },
  ],
});

export const metadata = createStaticPageMetadata({
  title: 'Điều khoản sử dụng',
  description: pageDescription,
  path: '/dieu-khoan-su-dung',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaMarkup schema={webPage} />
      <SchemaMarkup schema={breadcrumb} />
      {children}
    </>
  );
}
