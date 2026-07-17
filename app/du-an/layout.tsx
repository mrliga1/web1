import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dự án bất động sản',
  description: 'Các dự án bất động sản nổi bật tại TP.HCM. Thông tin chi tiết, tiến độ, giá bán từ Greenia Homes.',
  alternates: {
    canonical: 'https://greeniahomes.vn/du-an'
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
