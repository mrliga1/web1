import type { Metadata } from 'next';

export const metadata: Metadata = {
  
  description: 'Điều khoản sử dụng website Greenia Homes. Quy định về quyền và trách nhiệm khi sử dụng dịch vụ.',
  alternates: {
    canonical: 'https://greeniahomes.vn/dieu-khoan-su-dung'
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
