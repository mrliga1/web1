import ClientWrapper from "./ClientWrapper";
import {
  getPublicSettings,
  getPublishedProducts,
  getPublishedProjects,
} from "../../src/lib/serverContent";

export const revalidate = 60;

export default async function SanPhamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, productRows, projectRows, generalSettings, filterSettings] = await Promise.all([
    searchParams,
    getPublishedProducts(),
    getPublishedProjects(),
    getPublicSettings("general"),
    getPublicSettings("filters"),
  ]);
  const getParam = (key: string) => typeof params[key] === "string" ? params[key] : undefined;

  return (
    <ClientWrapper
      initialProducts={productRows.map(({ id, data }) => ({ ...data, id }))}
      initialProjects={projectRows.map(({ id, data }) => ({ ...data, id }))}
      initialGeneralSettings={generalSettings}
      initialFilterSettings={filterSettings}
      initialPriceRange={getParam("priceRange")}
      initialAreaRange={getParam("areaRange")}
      initialLocation={getParam("location")}
    />
  );
}
