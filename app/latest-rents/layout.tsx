import { getManagedStaticMetadata } from '../../src/lib/staticSeo';

export const generateMetadata = () => getManagedStaticMetadata('/latest-rents');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
