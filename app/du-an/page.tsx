import ClientWrapper from "./ClientWrapper";
import {
  getPublishedProducts,
  getPublishedProjects,
  getPublicLayout,
} from "../../src/lib/serverContent";

export const revalidate = 60;

export default async function DuAnPage() {
  const [projectRows, productRows, initialSections] = await Promise.all([
    getPublishedProjects(),
    getPublishedProducts(),
    getPublicLayout("du-an"),
  ]);

  return (
    <ClientWrapper
      initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
      initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
      initialSections={initialSections}
    />
  );
}
