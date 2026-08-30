import { getManagedStaticMetadata } from '../../src/lib/staticSeo';
import SchemaMarkup from '../../src/components/SchemaMarkup';
import { createWebPageSchemas } from '../../src/lib/contentSchemas';

const pageDescription = 'Chính sách bảo mật thông tin cá nhân của Greenia Homes. Cam kết bảo vệ dữ liệu khách hàng.';
const { webPage, breadcrumb } = createWebPageSchemas({
  path: '/chinh-sach-bao-mat',
  name: 'Chính sách bảo mật',
  description: pageDescription,
  topics: ['Bảo mật dữ liệu cá nhân', 'Quyền riêng tư'],
  breadcrumbs: [
    { name: 'Trang chủ', path: '/' },
    { name: 'Chính sách bảo mật', path: '/chinh-sach-bao-mat' },
  ],
});

export const generateMetadata = () => getManagedStaticMetadata('/chinh-sach-bao-mat');

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaMarkup schema={webPage} />
      <SchemaMarkup schema={breadcrumb} />
      {children}
    </>
  );
}
