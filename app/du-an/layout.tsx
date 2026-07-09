import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dự Án Bất Động Sản - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
