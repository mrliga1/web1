import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh Sách Yêu Thích - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
