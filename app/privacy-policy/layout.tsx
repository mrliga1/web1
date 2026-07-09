import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Mật - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
