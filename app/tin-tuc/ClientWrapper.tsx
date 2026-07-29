"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NewsList from "../../src/components/NewsList";
import { useAppContext } from "../../src/contexts/AppContext";
import { getRouteUrl } from "../../src/lib/utils";
import type { News, Product, Project, VisualSection } from "../../src/types";

export default function ClientWrapper({
  initialNews,
  initialProducts,
  initialProjects,
  initialGeneralSettings,
  initialSections,
}: {
  initialNews: News[];
  initialProducts: Product[];
  initialProjects: Project[];
  initialGeneralSettings: Record<string, unknown>;
  initialSections: VisualSection[];
}) {
  const { sections: contextSections, setSections, isEditMode } = useAppContext();
  const sections = !isEditMode && initialSections.length > 0 ? initialSections : contextSections;
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
