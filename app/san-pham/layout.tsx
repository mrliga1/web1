import { getManagedStaticMetadata } from '../../src/lib/staticSeo';

export const generateMetadata = () => getManagedStaticMetadata('/san-pham');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
