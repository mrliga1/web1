import HomePageClient from "./HomePageClient";
import SchemaMarkup from "../src/components/SchemaMarkup";
import { createHomePageSchema } from "../src/lib/internalLinks";
import { getHomePageInitialData } from "../src/lib/serverData";

export const revalidate = 60;

export default async function HomePage() {
  const initialData = await getHomePageInitialData();

  return (
    <>
      <SchemaMarkup schema={createHomePageSchema()} />
      <HomePageClient
        initialSections={initialData.sections}
        initialProducts={initialData.products}
        initialProjects={initialData.projects}
        initialNews={initialData.news}
        needsClientRefresh={initialData.needsClientRefresh}
      />
    </>
  );
}
