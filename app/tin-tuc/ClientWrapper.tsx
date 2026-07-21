"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NewsList from "../../src/components/NewsList";
import { useAppContext } from "../../src/contexts/AppContext";
import { getRouteUrl } from "../../src/lib/utils";
import type { News, Product, Project } from "../../src/types";

export default function ClientWrapper({
  initialNews,
  initialProducts,
  initialProjects,
  initialGeneralSettings,
}: {
  initialNews: News[];
  initialProducts: Product[];
  initialProjects: Project[];
  initialGeneralSettings: Record<string, unknown>;
}) {
  const { sections, setSections, isEditMode } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <NewsList
      onNavigate={(route) => router.push(getRouteUrl(route))}
      onShowNotification={() => undefined}
      isEditMode={isEditMode}
      sections={sections}
      onUpdateSections={setSections}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
      initialNews={initialNews}
      initialProducts={initialProducts}
      initialProjects={initialProjects}
      initialGeneralSettings={initialGeneralSettings}
    />
  );
}
