import ClientWrapper from "../san-pham/ClientWrapper";
import {
  getPublicSettings,
  getPublicLayout,
  getPublishedProducts,
  getPublishedProjects,
} from "../../src/lib/serverContent";

export const revalidate = 60;

export default async function LatestSalesPage() {
  const [productRows, projectRows, generalSettings, filterSettings, initialSections] = await Promise.all([
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
    getPublicSettings("filters"),
    getPublicLayout("san-pham"),
  ]);

  return (
    <ClientWrapper
      initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
      initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
      initialGeneralSettings={generalSettings}
      initialFilterSettings={filterSettings}
      initialSections={initialSections}
      initialType="sale"
    />
  );
}
