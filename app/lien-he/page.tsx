import ContactPageClient from './ContactPageClient';
import { getPublicLayout } from '../../src/lib/serverContent';

export const revalidate = 60;

export default async function LienHePage() {
  const initialSections = await getPublicLayout('lien-he');
  return <ContactPageClient initialSections={initialSections} />;
}
