import type { Metadata } from 'next';

export const metadata: Metadata = {
  
  description: 'Tin tức bất động sản mới nhất. Phân tích thị trường, xu hướng đầu tư, kiến thức mua bán nhà đất.',
  alternates: {
    canonical: 'https://greeniahomes.vn/tin-tuc'
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
