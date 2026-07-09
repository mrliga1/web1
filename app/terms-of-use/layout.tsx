import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều Khoản Sử Dụng - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
