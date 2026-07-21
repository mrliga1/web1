import ClientWrapper from "./ClientWrapper";
import {
  getPublishedProducts,
  getPublishedProjects,
} from "../../src/lib/serverContent";

export const revalidate = 60;

export default async function DuAnPage() {
  const [projectRows, productRows] = await Promise.all([
    getPublishedProjects(),
    getPublishedProducts(),
  ]);

  return (
    <ClientWrapper
      initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
      initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
    />
  );
}
