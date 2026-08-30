import { getManagedStaticMetadata } from '../../src/lib/staticSeo';

export const generateMetadata = () => getManagedStaticMetadata('/yeu-thich');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
