import type { Metadata } from 'next';

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name).replace(/-/g, ' ');
  return {
    title: `Tin Tức ${decodedName} - Greenia Homes`,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
