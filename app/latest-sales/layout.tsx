import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bất Động Sản Mới Nhất - Bán - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
