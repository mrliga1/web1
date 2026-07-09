import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh Sách Bất Động Sản - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
