import HomePageClient from "./HomePageClient";
import { getHomePageInitialData } from "../src/lib/serverData";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialData = await getHomePageInitialData();

  return (
    <HomePageClient
      initialSections={initialData.sections}
      initialProducts={initialData.products}
      initialProjects={initialData.projects}
      initialNews={initialData.news}
      needsClientRefresh={initialData.needsClientRefresh}
    />
  );
}
