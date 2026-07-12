import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh SÃ¡ch YÃªu ThÃ­ch - Greenia Homes',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
