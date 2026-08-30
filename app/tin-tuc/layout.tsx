import { getManagedStaticMetadata } from '../../src/lib/staticSeo';

export const generateMetadata = () => getManagedStaticMetadata('/tin-tuc');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
