import ClientWrapper from "../san-pham/ClientWrapper";
import {
  getPublicSettings,
  getPublishedProducts,
  getPublishedProjects,
} from "../../src/lib/serverContent";

export const revalidate = 60;

export default async function LatestSalesPage() {
  const [productRows, projectRows, generalSettings, filterSettings] = await Promise.all([
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
    getPublicSettings("filters"),
  ]);

  return (
    <ClientWrapper
      initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
      initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
      initialGeneralSettings={generalSettings}
      initialFilterSettings={filterSettings}
      initialType="sale"
    />
  );
}
