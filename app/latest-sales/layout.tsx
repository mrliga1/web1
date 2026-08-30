import { getManagedStaticMetadata } from '../../src/lib/staticSeo';

export const generateMetadata = () => getManagedStaticMetadata('/latest-sales');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
