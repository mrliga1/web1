import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liên Hệ - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
