import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: ,
  description: 'Danh sách bất động sản chuyển nhượng mới nhất. Tìm kiếm căn hộ, nhà phố, biệt thự giá tốt tại Greenia Homes.',
  alternates: {
    canonical: 'https://greeniahomes.vn/latest-sales'
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
