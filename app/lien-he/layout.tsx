import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liên hệ',
  description: 'Liên hệ Greenia Homes để được tư vấn bất động sản chuyên nghiệp. Hotline: 0932 966 700.',
  alternates: {
    canonical: 'https://greeniahomes.vn/lien-he'
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
