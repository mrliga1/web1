import HomePageClient from "./HomePageClient";
import HomeHeroBanner from "../src/components/HomeHeroBanner";
import { createHomeStaticSectionContent } from "../src/components/HomeStaticSectionBodies";
import SchemaMarkup from "../src/components/SchemaMarkup";
import { createHomePageSchema } from "../src/lib/internalLinks";
import { getHomePageInitialData } from "../src/lib/serverData";

export const revalidate = 60;

export default async function HomePage() {
  const initialData = await getHomePageInitialData();
  const serverStaticSections = createHomeStaticSectionContent(
    initialData.sections, initialData.projects, initialData.news,
  );

  return (
    <>
      <SchemaMarkup schema={createHomePageSchema()} />
      <HomePageClient
        heroBanner={<HomeHeroBanner />}
        serverStaticSections={serverStaticSections}
        initialSections={initialData.sections}
        initialProducts={initialData.products}
        initialProjects={initialData.projects}
        initialNews={initialData.news}
        needsClientRefresh={initialData.needsClientRefresh}
      />
    </>
  );
}
