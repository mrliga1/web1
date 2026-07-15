import type { Metadata } from 'next';

export const metadata: Metadata = {
  
  description: 'Danh sách bất động sản yêu thích của bạn tại Greenia Homes.',
  alternates: {
    canonical: 'https://greeniahomes.vn/yeu-thich'
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
