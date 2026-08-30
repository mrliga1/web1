import { getManagedStaticMetadata } from '../../src/lib/staticSeo';

export const generateMetadata = () => getManagedStaticMetadata('/du-an');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
