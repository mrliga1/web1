import type { Metadata } from 'next';

export const metadata: Metadata = {
  
  description: 'Khám phá danh sách bất động sản cho thuê mới nhất tại Greenia Homes. Cập nhật liên tục các căn hộ, nhà phố cho thuê giá tốt.',
  alternates: {
    canonical: 'https://greeniahomes.vn/latest-rents'
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
