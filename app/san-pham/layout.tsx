import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bất động sản',
  description: 'Danh sách sản phẩm bất động sản tại Greenia Homes. Tìm kiếm căn hộ, nhà phố, biệt thự phù hợp nhu cầu.',
  alternates: {
    canonical: 'https://greeniahomes.vn/san-pham'
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
