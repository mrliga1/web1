import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: ,
  description: 'Chính sách bảo mật thông tin cá nhân của Greenia Homes. Cam kết bảo vệ dữ liệu khách hàng.',
  alternates: {
    canonical: 'https://greeniahomes.vn/chinh-sach-bao-mat'
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
