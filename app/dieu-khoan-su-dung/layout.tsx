import { createStaticPageMetadata } from '../../src/lib/internalLinks';

export const metadata = createStaticPageMetadata({
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản sử dụng website Greenia Homes. Quy định về quyền và trách nhiệm khi sử dụng dịch vụ.',
  path: '/dieu-khoan-su-dung',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
