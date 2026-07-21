import ClientWrapper from "./ClientWrapper";
import {
  getPublicSettings,
  getPublishedNews,
  getPublishedProducts,
  getPublishedProjects,
} from "../../src/lib/serverContent";

export const revalidate = 60;

export default async function TinTucPage() {
  const [newsRows, productRows, projectRows, generalSettings] = await Promise.all([
    getPublishedNews(),
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
  ]);

  return (
    <ClientWrapper
      initialNews={newsRows.map(({ id, data }) => ({ ...data, id }))}
      initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
      initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
      initialGeneralSettings={generalSettings}
    />
  );
}
