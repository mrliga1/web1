import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tin Tức Bất Động Sản - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
